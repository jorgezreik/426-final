import { Vector3, Raycaster, Object3D } from 'three';

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

const _origin = new Object3D();
_origin.position.copy(new Vector3(0.75, -0.35, 0))
const _destination = new Vector3();
const _direction = new Vector3();
const _raycaster = new Raycaster();

const _currentPos = new Vector3();

class GrapplingController {
    constructor(pointerLockController, document, scene) {
        this.delay = 7;
        this.counter = 0;

        this.dist = 20;
        this.lineWidth = 5;
        this.pointScale = 10;

        this.power = 20;

        this.lineGeometry = new LineGeometry();
        this.lineMaterial = new LineMaterial({ color: 0x000000, linewidth: this.lineWidth, dashed: false});
        this.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
        this.linePositions = new Float32Array((this.delay * this.pointScale) * 3);
        this.line = new Line2(this.lineGeometry,  this.lineMaterial);
        this.scene = scene;
        this.scene.add(this.line);

        this.velocity = new Vector3();

        // Global variables for grappling hook
        this.shootingGrapple = false; // True when grappling hook has been shot
        this.validIntersection = false;
        this.returningGrapple = false; // True when grapple hook is returning to player
        this.isAttached = false; // True when grapple has reached intersection point
        this.movingTowardGrapple = false;

        this.lastTime = undefined;

        this.pointerLockController = pointerLockController;
        this.camera = this.pointerLockController.getObject();
        this.camera.add(_origin);
        _raycaster.camera = this.camera;

        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Helper function that updates the line's position in world space
        // Source: https://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically/31411794#31411794
        this.updateLinePositions = function(positions, origin, destination){
            const direction = new Vector3().subVectors(destination, origin).normalize();
            const distance = origin.distanceTo(destination);
            var x = origin.x;
            var y = origin.y;
            var z = origin.z;
            var index = 0;
            for ( var i = 0, l = (this.delay * this.pointScale); i < l; i ++ ) {
                positions[ index ++ ] = x;
                positions[ index ++ ] = y;
                positions[ index ++ ] = z;
                x += direction.x * distance/(this.delay * this.pointScale);
                y += direction.y * distance/(this.delay * this.pointScale);
                z += direction.z * distance/(this.delay * this.pointScale);
            }
        }
    }

    onMouseDown(event) {
        if (this.pointerLockController.isLocked) {
            // Left click
            if (event.button == 0 && !this.returningGrapple) {
                

                // Sets the origin of the ray to be the camera's position in world space
                this.camera.getWorldPosition(_destination)
                _destination.addScaledVector(this.camera.getWorldDirection(new Vector3()), this.dist)
                
                _origin.getWorldPosition(_raycaster.ray.origin);
                _raycaster.ray.direction.subVectors(_destination, _raycaster.ray.origin).normalize();

                // Creates the line for the grappling hook
                this.updateLinePositions(this.linePositions, _raycaster.ray.origin, _destination);
                this.lineGeometry.setPositions(this.linePositions);
                this.lineGeometry.maxInstancedCount = 0;

                this.line.computeLineDistances();
				this.line.scale.set(1, 1, 1);

                this.scene.add(this.line);
                this.shootingGrapple = true;
                this.counter = 0;                // WIP
                // // Determines if the grapple hook intersects with any objects
                const planet = this.scene.children[0];
                const intersections = _raycaster.intersectObject(planet, true);
                if (intersections.length > 0) {
                    const nearest = intersections[0]
                    if (nearest.distance < this.dist) {
                        this.validIntersection = true;
                        // _destination.copy(intersections.point)
                    }
                }
            }
            // Right click while grappling
            else if (event.button == 2 && this.isAttached) {
                this.movingTowardGrapple = true;
                console.log("Player is moving toward grappling hook")
            }
        }
    }

    onMouseUp(event) {
        if (this.pointerLockController.isLocked) {
            // Release left click
            if (event.button == 0 && (this.shootingGrapple || this.isAttached)) {
                this.shootingGrapple = false;
                this.isAttached = false;
                this.movingTowardGrapple = false;
                this.returningGrapple = true;
                console.log("Grappling hook has been released")
            }
            // Release right click while grappling
            else if (event.button == 2 && this.isGrappling) {
                this.movingTowardGrapple = false;
                console.log("Player is no longer moving to grappling hook")
            }
        }
    }

    update() {
        this.camera.getWorldPosition(_currentPos);
        if (this.shootingGrapple || this.returningGrapple || this.isAttached) {

            this.counter += this.shootingGrapple ? 1 : this.returningGrapple ? -1 : 0;
            if (this.counter >= this.delay && !this.isAttached) {
                this.shootingGrapple = false;
                if (this.validIntersection) this.isAttached = true
                else this.returningGrapple = true;
            }
            else if (this.counter < 0) {
                this.returningGrapple = false;
                this.validIntersection = false;
                this.scene.remove(this.line)
            }
        
            this.updateLinePositions(this.linePositions, _origin.getWorldPosition(new Vector3()), _destination);
            this.lineGeometry.setPositions(this.linePositions);
            this.lineGeometry.maxInstancedCount = this.counter * this.pointScale;
        
            // If the grappling hook exists in world space, use grappling hook behavior
            _direction.subVectors(_destination, _currentPos).normalize();
            const distance = _destination.distanceTo(_currentPos);
             // If the grappling hook has reached its destination point...
            if (this.isAttached) {
                // Moves towards grappling hook; this behavior isn't physically simulated yet
                if (this.movingTowardGrapple) this.velocity.addScaledVector(_direction, this.power);
                // Prevents the player from moving too far from the grappling hook
                if (distance > this.dist) this.velocity.addScaledVector(_direction, (distance-this.dist/distance));
            }
        }
    }
}

export default GrapplingController;
