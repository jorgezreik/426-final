import { Mesh, MeshPhongMaterial, Vector3, DoubleSide, Raycaster } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// File locations for the gems
const _gems = ['./src/components/objects/Gem/gem1.obj',
                './src/components/objects/Gem/gem2.obj',
                './src/components/objects/Gem/gem3.obj',
                './src/components/objects/Gem/gem4.obj',
                './src/components/objects/Gem/gem5.obj'];

// Color palette from:
// https://www.color-hex.com/color-palette/25406
const _colors = ['#8cd9ff',
                 '#6caddf',
                 '#3a55b4',
                 '#b5e7ee',
                 '#2190e3'];

const _up = new Vector3();
const _raycaster = new Raycaster();
const _origin = new Vector3();
const _direction = new Vector3();
const _position = new Vector3();

class Gem {
    constructor(scene, index) {
        const loader = new OBJLoader();
        this.name = 'Gem'+index;
        this.index = index
        this.scene = scene;
        this.lifeTime = 0; // How long the gem has been in its current state

        // Loads a random gem
        const rand = Math.floor(Math.random() * 5);
        const mat = new MeshPhongMaterial({
            color: _colors[rand],
            shininess: 10,
            reflectivity: 10,
            specular: 10,
            side: DoubleSide
        });
        mat.flatShading = true;
        loader.load(_gems[rand], (obj) => {
            this.obj = obj;
            this.obj.traverse( function( child ) {
                if ( child instanceof Mesh ) {
                    child.material = mat;  
                }
            });

            this.scene.add(this.obj);
            this.obj.visible = false;
        });

        // Sets the gems position and adjusts its rotation so 
        // that its up vector is parallel to gravity
        this.setPosition = function(position) {
            _up.copy(position).normalize();
            this.obj.quaternion.setFromUnitVectors(this.obj.up, _up.multiplyScalar(-1));
            this.obj.up.copy(_up);
            this.obj.position.copy(position);
        }

        // Hides the gem and sets its lifeTime to 0
        this.hide = function() {
            this.obj.visible = false;
            this.lifeTime = 0;
        }
        // Makes the gem visible
        this.show = function() {
            this.obj.visible = true;
        }
    }
}


class GemGenerator {
    constructor(playerController, scene) {
        // Takes the player controller to update the score
        this.playerController = playerController;
        this.scene = scene;
        this.terrain = this.scene.children[0].children[0]; // Inner mesh
        // Vertices of the terrain
        this.vertices = this.terrain.geometry.attributes.position.array;
        // Normals of the terrain
        this.normals = this.terrain.geometry.attributes.normal.array;
        // Number of vertices
        this.vertsLength = this.vertices.length/3;

        // Minimum distance for raycast rejection sampling
        this.minDistToMesh = 25;
        // Minimum distance to keep gems away from the center
        this.minDistToCenter = 50;
        // Max number of gems on the screen at a given time
        this.maxGemCount = 10;
        
        // Sets up the raycaster
        _raycaster.ray.origin = _origin;
        _raycaster.ray.direction = _direction;

        // Sets the max lifespan of the gems
        this.gemLifeSpan = 120; // 120 seconds
        // Loads the gem objects into the array
        this.gems = [];
        for (let i = 0; i < this.maxGemCount; i++){
            this.gems.push(new Gem(this.scene, i));
        }
        
        // Resets the gem's position; used for gems that aren't visible
        this.resetPosition = function(gem) {
            // Gets a random vertex and its corresponding normal from the inner terrain
            const idx = Math.floor(Math.random() * this.vertsLength) * 3; // Since each vert has 3 axes
            _direction.set(this.normals[idx], this.normals[idx+1], this.normals[idx+2]);
            _origin.set(this.vertices[idx], this.vertices[idx+1], this.vertices[idx+2]);
            _origin.add(_direction); // Moves the origin point to prevent self-intersection when raycasting

            // Uses raycasting between the random point and the mesh
            const intersections = _raycaster.intersectObject(this.terrain, true);
            if (intersections.length > 0) {
                const nearest = intersections[0];
                // If the nearest point is far enough away...
                if (nearest.distance > this.minDistToMesh) {
                    // Sets the position to be in the middle of the origin and
                    // intersection point
                    _position.copy(_origin).addScaledVector(_direction, nearest.distance/2);
                    // If the position is far enough away from the center...
                    const sqDistFromCenter = _position.x ** 2 +
                                            _position.y ** 2 + 
                                            _position.z ** 2;
                    if (sqDistFromCenter > this.minDistToCenter) {
                        // Sets the position of the gem and shows it
                        gem.setPosition(_position);
                        gem.show();
                    }
                }
            }
        }
    }

    update(timeStamp) {
        if (this.lastTime === undefined) {
            this.lastTime = timeStamp;
            return;
        }
        // In seconds
        const timeElapsed = (timeStamp - this.lastTime) / 1000;

        // Gets the player's position
        const playerPosition = this.playerController.state.position;
        let canGenerateNew = true; // Prevents multiple raycasts in the same frame
        // Loops through the gems
        for (let i = 0; i < this.gems.length; i++) {
            const gem = this.gems[i];
            if (gem.obj != undefined) {
                if (gem.obj.visible) {
                    // Hides the gem and increments the players score if the gem
                    // is close enough
                    if (gem.obj.position.distanceToSquared(playerPosition) < 5) {
                        this.playerController.score += 5;
                        gem.hide()
                        console.log(this.playerController.score);
                    }
                    // Hides the gem if it has been in its current position
                    // longer than the max life span
                    else if (gem.lifeTime > this.gemLifeSpan) {
                        gem.hide();
                    }
                    // Rotates the gem and increments its life time
                    else {
                        gem.lifeTime += timeElapsed;
                        gem.obj.rotateY(2 * timeElapsed);
                    }
                }
                else {
                    // If the current gem in the array is hidden and the code
                    // hasn't cast a ray in this frame yet
                    if (canGenerateNew) {
                        // Performs rejection sampling to potentially
                        // make the gem visible
                        this.resetPosition(gem);
                        canGenerateNew = false;
                    }
                }
            } 
        }

        this.lastTime = timeStamp;
    }
}

export default GemGenerator;
