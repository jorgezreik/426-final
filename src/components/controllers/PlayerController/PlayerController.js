import { Quaternion, Vector3 } from 'three';
import { PointerLockController, GrapplingController } from 'controllers';

const _up = new Vector3();
const _otherUp = new Vector3();
const _quaternion = new Quaternion();
const _posY = new Vector3(0, 1, 0);
const _v = new Vector3();
const _v2 = new Vector3();
const _airResistance = 0.03;
const _airVector = new Vector3();
let _cameraAcceleration = new Vector3();

let _count = 0;

let _oldPos = new Vector3();

// TODO: Remove
let _first = true;

class PlayerController {
    constructor(cameraController, canvas, document, scene) {
        this.state = {
            acceleration: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            // With gravity
            cameraAcceleration: new Vector3(0, -5, 0),
            driftAcceleration: new Vector3(0, 0, 0),
            position: new Vector3(0, 0, -60),
        };

        this.lastTime = undefined;

        this.cameraController = cameraController;

        this.controls = new PointerLockController(
            cameraController.camera,
            canvas
        );

        this.terrainVertices = scene.children[0].vertexVectors;
        this.terrainNormals = scene.children[0].normalVectors;

        this.cameraController.camera.lookAt(0, 0, 0);

        this.movementFactor = 10;

        this.grappleFactor = 20;

        this.grapplingController = new GrapplingController(
            this.controls,
            this.state,
            this.grappleFactor,
            document,
            scene
        );

        this.score = 0;

        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onMouseDown(event) {
        if (!this.controls.isLocked) this.controls.lock();
    }

    onKeyDown(event) {
        const a = this.state.driftAcceleration;

        switch (event.key) {
            case 'w':
                a.z = -1;
                break;
            case 'a':
                a.x = -1;
                break;
            case 's':
                a.z = 1;
                break;
            case 'd':
                a.x = 1;
                break;
            case ' ':
                a.y = 1;
                break;
            case 'Control':
                a.y = -1;
                break;
        }

        a.normalize();
    }

    onKeyUp(event) {
        const a = this.state.driftAcceleration;

        switch (event.key) {
            case 'w':
                a.z = 0;
                break;
            case 'a':
                a.x = 0;
                break;
            case 's':
                a.z = 0;
                break;
            case 'd':
                a.x = 0;
                break;
            case ' ':
                a.y = 0;
                break;
            case 'Control':
                a.y = 0;
                break;
        }

        a.normalize();
    }

    checkCollision(timeElapsed) {
        const delta = _v2.subVectors(this.state.position, _oldPos);

        const collidingIndex = [];
        for (const [i, v] of this.terrainVertices.entries()) {
            const dist2 = v.distanceToSquared(this.state.position);
            if (dist2 < 4) {
                if (this.terrainNormals[i].dot(delta) >= 0)
                    collidingIndex.push([i, dist2]);
            }
        }
        collidingIndex.sort((a, b) => a[1] - b[1]);

        if (collidingIndex.length > 0) {
            const norm = _v.set(0, 0, 0);
            for (let i = 0; i < Math.min(3, collidingIndex.length); i++) {
                norm.add(this.terrainNormals[collidingIndex[i][0]]);
            }
            norm.divideScalar(collidingIndex.length).normalize();

            this.state.position.addScaledVector(norm, -norm.dot(delta));

            this.state.velocity
                .subVectors(this.state.position, _oldPos)
                .divideScalar(timeElapsed);
        }
    }

    cameraToWorld(vector) {
        _v.copy(vector).applyQuaternion(
            this.cameraController.camera.quaternion
        );
        _v.applyQuaternion(_quaternion.setFromUnitVectors(_otherUp, _up));
        return _v;
    }

    update(timeStamp) {
        _count++;

        if (this.lastTime === undefined) {
            this.lastTime = timeStamp;
            return;
        }

        // In seconds
        const timeElapsed = (timeStamp - this.lastTime) / 1000;

        // Update ups
        _up.copy(this.state.position).multiplyScalar(-1).normalize();
        _otherUp
            .copy(_posY)
            .applyQuaternion(this.cameraController.camera.quaternion);

        // driftAcceleration to cameraAcceleration
        this.state.cameraAcceleration.addScaledVector(
            this.state.driftAcceleration,
            this.movementFactor
        );

        // cameraAcceleration to acceleration
        _cameraAcceleration.copy(this.cameraToWorld(this.state.cameraAcceleration));
        this.state.acceleration.add(_cameraAcceleration);

        // Grappling acceleration
        // if (_count % 60 === 0) console.log(_cameraAcceleration.clone());
        // if (_count % 60 === 0) console.log(this.grapplingController.acceleration);
        this.state.acceleration.add(this.grapplingController.acceleration);
        // if (_count % 60 === 0) console.log(this.state.acceleration.clone());

        // Air resistance
        _airVector
            .copy(this.state.velocity)
            .multiplyScalar(this.state.velocity.length() * _airResistance);

        this.state.acceleration.sub(_airVector);

        // Interpolate acceleration to velocity
        this.state.velocity.addScaledVector(
            this.state.acceleration,
            timeElapsed
        );

        // Interpolate velocity to position
        this.state.position.addScaledVector(this.state.velocity, timeElapsed);

        // Grappling hook may also update position
        this.grapplingController.update(timeElapsed);

        // Check collision
        this.checkCollision(timeElapsed);

        this.cameraController.update(this.state.position);

        this.lastTime = timeStamp;

        if (_count % 60 === 0) console.table(this.state);

        // Reset grappling acceleration
        this.state.acceleration.sub(this.grapplingController.acceleration);

        // Reset acceleration
        this.state.acceleration.sub(_cameraAcceleration);

        // Reset movement
        this.state.cameraAcceleration.addScaledVector(
            this.state.driftAcceleration,
            -this.movementFactor
        );

        // Reset airResistance
        this.state.acceleration.add(_airVector);

        // Set old position
        _oldPos.copy(this.state.position);

        // TODO: Remove
        if (_first) {
            _first = false;
            this.state.position.set(0, 0, -60);
        }
    }
}

export default PlayerController;
