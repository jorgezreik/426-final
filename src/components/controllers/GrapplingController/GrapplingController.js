import { Vector3, Raycaster, Object3D } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

// Performs simple verlet integration on rope when true
const _physicsRope = true;

// Variables for raycasting and rope drawing
const _origin = new Vector3();
const _destination = new Vector3();
const _direction = new Vector3();
let _distance = 0;
const _raycaster = new Raycaster();

// For updating the rope
const _vAB = new Vector3();
const _position = new Vector3();
// For verlet integration
const _verletDiff = new Vector3();

// For the delay of the rope's attachment
const _delay = 25;
let _counter = 0;

// Grappling hook variables
let _validIntersection = false; // True when the raycast has intersected with a close enough object

class RopeParticle {
    constructor() {
        this.position = new Vector3(); // position
        this.previous = new Vector3(); // previous

        // Sets the position of this particle
        this.setPosition = function(pos, setBoth=true) {
            if (setBoth) {
                this.position.copy(pos); // position
                this.previous.copy(pos); // previous
            }
            else {
                this.previous.copy(this.position); // previous
                this.position.copy(pos); // position   
            }
        }

        // Performs simple verlet integration on the current particle;
        // Doesn't take into account any forces
        this.integrate = function(timeElapsed) {
            _verletDiff.subVectors(this.position, this.previous).multiplyScalar(1-timeElapsed);
            this.previous.copy(this.position);
            this.position.add(_verletDiff);
        };
    }
}

class Rope {
    constructor(camera, scene) {
        // Creates list for particles
        if (_physicsRope) {
            this.particles = [];
            for (let i = 0; i < _delay; i++) {
                this.particles.push(new RopeParticle());
            }
        }

        this.camera = camera;
        this.scene = scene;

        this.fired = false; // True when the rope is moving away player
        this.returning = false; // True when the rope is returning to player
        this.isAttached = false; // True when the rope is attached to terrain
        this.pullingPlayer = false; // True when the player is moving towards the destination point
        this.increment = 0; // How quickly the rope should be incrementing

        this.restLength = 0;
        this.restDist = 0; // the rest distance between each particle when attached
    
        this.width = 5;
        this.geometry = new LineSegmentsGeometry();
        this.material = new LineMaterial({ color: 0x000000, linewidth: this.width, dashed: false});
        this.material.resolution.set(window.innerWidth, window.innerHeight);
        this.positions = new Float32Array((_delay * 3 - 3) * 2);
        this.mesh = new Line2(this.geometry,  this.material);

        // Updates the rest distances when the line is rope is first created
        this.updateRestDistance = function() {
            this.restLength = _destination.distanceTo(_origin);
            this.restDist = this.restLength/_delay;
        }

        // Updates the rope without Verlet integration.
        this.updateRope = function(){
            _position.copy(_origin)
            let j = 0;
            for (let i = 0; i < this.positions.length; i += 3) {
                // If the physics simulation is activated, updates its particles
                if (_physicsRope && j < this.particles.length)
                    this.particles[j].setPosition(_position, false);

                // Sets up the current pair of points for the LineSegment geometry
                this.positions[2 * i] = _position.x;
                this.positions[2 * i + 1] = _position.y;
                this.positions[2 * i + 2] = _position.z;
                _position.addScaledVector(_direction, _distance/_delay);
                this.positions[2 * i + 3] = _position.x;
                this.positions[2 * i + 4] = _position.y;
                this.positions[2 * i + 5] = _position.z;
                j++;
            }
        }

        this.enforceConstraints = function(p1, p2) {
            // Enforce the rope constraints
            _vAB.subVectors(p1.position, p2.position);
            const length = p1.position.distanceTo(p2.position);
            _vAB.multiplyScalar((length-this.restDist)/length);
            p1.position.addScaledVector(_vAB, -1/2);
            p2.position.addScaledVector(_vAB, 1/2);
        }

        // Updates the rope with Verlet integration. Only used
        // for the attached rope
        this.updateAttachedRope = function(timeElapsed){
            if (_distance <= this.restLength) {
                this.restDist = _distance/(_delay*+2)
            }

            let j = 0;
            // Applies the first constraints for p1 and p2
            this.particles[1].integrate(timeElapsed);
            this.enforceConstraints(this.particles[0], this.particles[1]);
            this.particles[0].setPosition(_origin);
            for (let i = 0; i < this.positions.length; i += 3) {
                const p1 = this.particles[j]; // Has already been integrated
                const p2 = this.particles[j+1]; // Has already been integrated
                const p3 = this.particles[j+2]; // Has not been integrated

                // Sets up the current pair of points for the LineSegment geometry
                this.positions[2 * i] = p1.position.x;
                this.positions[2 * i + 1] = p1.position.y;
                this.positions[2 * i + 2] = p1.position.z;
        
                if (p2 != undefined) {
                    // If p3 is defined, must integrate it to apply its 
                    // constraints with p2 before using p2 for the positions array
                    if (p3 != undefined) {
                        p3.integrate(timeElapsed);
                        this.enforceConstraints(p2, p3);
                    }
                    // Otherwise, p2 must be the last particle, so pin it
                    // to the destination point
                    else p2.setPosition(_destination);
                    this.positions[2 * i + 3] = p2.position.x;
                    this.positions[2 * i + 4] = p2.position.y;
                    this.positions[2 * i + 5] = p2.position.z;
                    j++;
                }
            }
        }        
    }

    // Updates the rope
    update(timeElapsed) {
        if (this.fired || this.returning || this.isAttached) {    
            _counter += this.fired ? this.increment : this.returning ? -this.increment : 0;
            if (_counter >= _delay && !this.isAttached) {
                _counter = _delay-1;
                this.fired = false;
                if (_validIntersection) this.isAttached = true;
                else this.returning = true;
            }
            else if (_counter < 0) {
                _counter = 0;
                this.returning = false;
                _validIntersection = false;
                this.scene.remove(this.mesh);
                this.isAttached = false;
            }

            _origin.set(0.75, -0.35, 0);
            this.camera.localToWorld(_origin);
            _direction.subVectors(_destination, _origin).normalize();
            _distance = _destination.distanceTo(_origin);

            // Updates the rope with Verlet integration if the rope is attached,
            // the player is not moving towards the destination point,
            // and the _physicsRope flag is true
            if (this.isAttached && !this.pullingPlayer && _physicsRope && _distance > 10) this.updateAttachedRope(timeElapsed);
            else this.updateRope();
            this.geometry.setPositions(this.positions); // Updates rope positions in World space
            this.geometry.maxInstancedCount = _counter;
        }
    }
}


// Class for the raycasting for grappling hook
class GrapplingController {
    constructor(pointerLockController, state, grappleFactor, document, scene) {
        this.maxDist = 100; // The maximum length of the grappling hook

        this.acceleration = new Vector3();
        this.increment = 1; // how much the counter is incremented

        this.pointerLockController = pointerLockController;
        this.camera = this.pointerLockController.getObject();

        // Sets up the raycaster
        _raycaster.camera = this.camera;
        _raycaster.ray.origin = _origin;
        _raycaster.ray.direction = _direction;

        this.grappleFactor = grappleFactor;
        
        this.scene = scene;
        this.terrain = this.scene.children[0].children[0];
    
        this.rope = new Rope(this.camera, this.scene);
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onMouseDown(event) {
        if (this.pointerLockController.isLocked) {
            // Left click
            if (event.button == 0 && !this.rope.returning && !this.rope.fired && !this.rope.isAttached) {
                _validIntersection = false;

                // Gets the destination point
                _destination.set(0, 0, -this.maxDist); // The forward direction towards the maximum distance
                this.camera.localToWorld(_destination);
                
                // Sets the origin to be offset from the camera
                _origin.set(0.75, -0.35, 0);
                this.camera.localToWorld(_origin);
                
                // Sets up the direction vector
                _direction.subVectors(_destination, _origin).normalize();

                // Creates the line for the grappling hook
                this.rope.fired = true;
                _counter = 0;
                // Determines if the grapple hook intersects with any objects
                const intersections = _raycaster.intersectObject(this.terrain, true);
                if (intersections.length > 0) {
                    const nearest = intersections[0];
                    if (nearest.distance < this.maxDist && nearest.distance > 0.03) {
                        _validIntersection = true;
                        _destination.copy(nearest.point);
                    }
                }
                this.rope.updateRestDistance();
                this.rope.increment = Math.min(Math.round(this.maxDist/this.rope.restLength), _delay);
                this.scene.add(this.rope.mesh);
            }
            // Right click while grappling
            else if (event.button == 2 && this.rope.isAttached) {
                this.rope.pullingPlayer = true;
            }
        }
    }

    onMouseUp(event) {
        if (this.pointerLockController.isLocked) {
            // Release left click
            if (event.button == 0 && (this.rope.fired || this.rope.isAttached)) {
                this.rope.fired = false;
                this.rope.isAttached = false;
                this.rope.pullingPlayer = false;
                this.rope.returning = true;
            }
            // Release right click while grappling
            else if (event.button == 2 && this.rope.isAttached) {
                this.rope.pullingPlayer = false;
            }
        }
    }

    onKeyDown(event) {
        if (this.pointerLockController.isLocked && event.key == "Shift" && this.rope.isAttached) {
            // Release right click while grappling
            this.rope.pullingPlayer = true;
        }
    }

    onKeyUp(event) {
        if (this.pointerLockController.isLocked && event.key == "Shift" && this.rope.isAttached) {
            // Release right click while grappling
            this.rope.pullingPlayer = false;
        }
    }

    update(timeElapsed) {
        // Calculates the updated acceleration
        if (this.rope.isAttached) {
            _origin.set(0.75, -0.35, 0);
            this.camera.localToWorld(_origin);
            _direction.subVectors(_destination, _origin).normalize();
            if (this.rope.pullingPlayer) this.acceleration.copy(_direction).multiplyScalar(this.grappleFactor); 
            else this.acceleration.copy(_direction).multiplyScalar(0.15 * this.grappleFactor);
        }
        else this.acceleration.set(0, 0, 0);
    }
}

export default GrapplingController;
