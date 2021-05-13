import { Quaternion, Vector3 } from 'three';
import { PointerLockController, GrapplingController } from 'controllers';

const _up = new Vector3();
const _otherUp = new Vector3();
const _quaternion = new Quaternion();
const _posY = new Vector3(0, 1, 0);

class PlayerController {
    constructor(cameraController, canvas, document, scene) {
        this.state = {
            acceleration: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            cameraVelocity: new Vector3(0, 0, 0),
            position: new Vector3(0, 0, -60),
        };

        this.lastTime = undefined;

        this.cameraController = cameraController;

        this.controls = new PointerLockController(
            cameraController.camera,
            canvas
        );
        scene.add(cameraController.camera);

        this.cameraController.camera.lookAt(0, 0, 0);

        this.movementFactor = 15;

        this.grapplingController = new GrapplingController(
            this.controls, this.state,  
            this.movementFactor, document, scene
        );

        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onMouseDown(event) {
        if (!this.controls.isLocked) this.controls.lock();
    }

    onKeyDown(event) {
        const v = this.state.cameraVelocity;

        switch (event.key) {
            case 'w':
                v.z = -1;
                break;
            case 'a':
                v.x = -1;
                break;
            case 's':
                v.z = 1;
                break;
            case 'd':
                v.x = 1;
                break;
            case ' ':
                v.y = 1;
                break;
            case 'Control':
                v.y = -1;
                break;
        }
    }

    onKeyUp(event) {
        const v = this.state.cameraVelocity;

        switch (event.key) {
            case 'w':
                v.z = 0;
                break;
            case 'a':
                v.x = 0;
                break;
            case 's':
                v.z = 0;
                break;
            case 'd':
                v.x = 0;
                break;
            case ' ':
                v.y = 0;
                break;
            case 'Control':
                v.y = 0;
                break;
        }
    }

    update(timeStamp) {
        if (this.lastTime === undefined) {
            this.lastTime = timeStamp;
            return;
        }

        // In seconds
        const timeElapsed = (timeStamp - this.lastTime) / 1000;

        _up.copy(this.state.position).multiplyScalar(-1).normalize();

        _otherUp
            .copy(_posY)
            .applyQuaternion(this.cameraController.camera.quaternion);

        // Update velocity
        this.state.velocity
            .copy(this.state.cameraVelocity)
            .applyQuaternion(this.cameraController.camera.quaternion);
        this.state.velocity.applyQuaternion(
            _quaternion.setFromUnitVectors(_otherUp, _up)
        );
        
        this.state.velocity.add(this.grapplingController.velocity);

        // Applies gravity if the player is far enough away from the center
        const sqDistFromCenter = this.state.position.x ** 2 +
                                this.state.position.y ** 2 + 
                                this.state.position.z ** 2;
        this.state.velocity.addScaledVector(_up, -0.75);
        // Update position
        this.state.position.addScaledVector(
            this.state.velocity,
            timeElapsed * this.movementFactor
        );

        this.grapplingController.update(timeElapsed); // Grappling hook may also update position
        this.cameraController.update(this.state.position);

        this.lastTime = timeStamp;
    }
}

export default PlayerController;
