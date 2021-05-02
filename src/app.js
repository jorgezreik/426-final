/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

// Much of this code is currently adapted from:
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

import { WebGLRenderer, PerspectiveCamera, Vector3, Raycaster, Object3D } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { SeedScene } from 'scenes';

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

let camera, scene, renderer, controls;

let objects = [];

// Global variables for player controls
let moveSpeed = 200;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let feetRaycaster;

// Global variables for grappling hook
let shootingGrapple = false; // True when grappling hook has been shot
let returningGrapple = false; // True when grapple hook is returning to player
let isGrappling = false; // True when grapple has reached intersection point
let movingTowardGrapple = false;
let delay = 7; // number of timesteps before reaching max distance
let counter = 0; // counter to keep track of the current delay
let grappleDist = 20;
let grappleDestination = null;
let grappleLine = null;
let grappleRaycaster;
let grappleOrigin = new Object3D();
grappleOrigin.position.copy(new Vector3(0.75, -0.35, 0));
let grappleLineWidth = 5;
const pointScale = 10; // increases the number of points on the line by this factor


let prevTime = performance.now();
const velocity = new Vector3();
const direction = new Vector3();
//const vertex = new THREE.Vector3();
//const color = new THREE.Color();

// Global variables for gravity and planet logic
// const planetCenter = new Vector3();
// const gravity = 9.8;
// const playerMass = 100;

init();
animate();

// Helper function that updates the line's position in world space
// Source: https://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically/31411794#31411794
function updateLinePositions(positions, origin, direction){
    // var positions = grappleLine.geometry.attributes.position.array;

    var x = origin.x;
    var y = origin.y;
    var z = origin.z;
    var index = 0;
    for ( var i = 0, l = (delay * pointScale); i < l; i ++ ) {

        positions[ index ++ ] = x;
        positions[ index ++ ] = y;
        positions[ index ++ ] = z;
        x += direction.x * grappleDist/(delay * pointScale);
        y += direction.y * grappleDist/(delay * pointScale);
        z += direction.z * grappleDist/(delay * pointScale);
    }
    // grappleLine.geometry.attributes.position.needsUpdate = true; // required after the first 
}

function init() {
    // Initializes the scene
    scene = new SeedScene();

    // Initializes the camera and pointer lock controls
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.add(grappleOrigin);
    camera.position.y = 10;

    controls = new PointerLockControls( camera, document.body );
    scene.add(controls.getObject());

    objects = scene.state.updateList;

    // Initalizes the event handlers for movement
    const onKeyDown = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;

        }

    };

    const onKeyUp = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

        }

    };
    const onMouseDown = (event) => {
        if (controls.isLocked) {
            // Left click
            if (event.button == 0 && !returningGrapple) {
                // Sets the origin of the ray to be the camera's position in world space
                grappleDestination = new Vector3()
                camera.getWorldPosition(grappleDestination)
                grappleDestination.addScaledVector(camera.getWorldDirection(new Vector3()), grappleDist)
                
                grappleOrigin.getWorldPosition(grappleRaycaster.ray.origin);
                grappleRaycaster.ray.direction.subVectors(grappleDestination, grappleRaycaster.ray.origin).normalize();

                // Creates the line for the grappling hook
                var geometry = new LineGeometry();
                var positions = new Float32Array((delay * pointScale) * 3); // 3 because point is 3D
                updateLinePositions(positions, grappleRaycaster.ray.origin, grappleRaycaster.ray.direction);
                geometry.setPositions(positions);
                geometry.maxInstancedCount = 0;
                var material = new LineMaterial({ color: 0x000000, linewidth: grappleLineWidth, dashed: false});
                material.resolution.set(window.innerWidth, window.innerHeight); // resolution of the viewport
                grappleLine = new Line2(geometry,  material);
                grappleLine.computeLineDistances();
				grappleLine.scale.set(1, 1, 1);
                scene.add(grappleLine);
                shootingGrapple = true;
                counter = 0;
                console.log("Grappling hook has been fired")

                // WIP
                // // Determines if the grapple hook intersects with any objects
                // const grappleInters = grappleRaycaster.intersectObjects(objects);
                // if (grappleInters.length > 0) {
                //     grappleDist.copy(grappleInters[0].point);
                //     shootingGrapple = true;
                //     isGrappling = false;
                //     counter = 0;
                //     console.log("init grapple");
                // }
                // console.log(grappleLine)

            }
            // Other mouse clicks
            else if (event.button == 2 && isGrappling) {
                movingTowardGrapple = true;
                console.log("Player is moving toward grappling hook")
            }
        }
        else controls.lock();

        
    }

    const onMouseUp = (event) => {
        if (controls.isLocked) {
            // Left click
            if (event.button == 0 && (shootingGrapple || isGrappling)) {
                shootingGrapple = false;
                isGrappling = false;
                returningGrapple = true;
                movingTowardGrapple = false;
                console.log("Grappling hook has been released")
            }
            // Other mouse clicks
            else if (isGrappling) {
                movingTowardGrapple = false;
                console.log("Player is no longer moving to grappling hook")
            }
        }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    // Initializes raycaster to check if the player is on the ground TODO
    feetRaycaster = new Raycaster(new Vector3(), new Vector3(0, - 1, 0), 0, 10);

    // Initializes raycaster to check if the player is on the ground TODO
    grappleRaycaster = new Raycaster(new Vector3(), new Vector3(0, 0, -1), 0, grappleDist);

    // Initializes the renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    const canvas = renderer.domElement;
    canvas.style.display = 'block'; // Removes padding below canvas
    document.body.style.margin = 0; // Removes margin around page
    document.body.style.overflow = 'hidden'; // Fix scrolling
    document.body.appendChild(canvas);

    // Handles window resizing
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener( 'resize', onWindowResize );

}


// Render loop
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if ( controls.isLocked === true ) {
        // Uses raycasting to determine if the player's
        // feet are on the ground to prevent infinite jumping
        // *** This doesn't account for the camera's roation
        feetRaycaster.ray.origin.copy(controls.getObject().position);
        feetRaycaster.ray.origin.y -= 10;
        const feetInters = feetRaycaster.intersectObjects(objects);
        const grounded = feetInters.length > 0;

        const delta = (time - prevTime) / 1000;

        // Currently calculates gravity generally downwards
        // Should have it to where you calculate the netforce of the
        // player
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        // velocity.y -= gravity * playerMass * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * moveSpeed * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * moveSpeed * delta;

        if (grounded) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }

        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );

        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;
        }

        
        /////////////////////////////////////////////
        // If the grappling hook has been fired
        if (shootingGrapple) {
            if (counter < delay) {
                counter++;
            }
            else {
                shootingGrapple = false;
                isGrappling = true;
                console.log("Grappling hook has reached max distance");
            }
        }
        // If the grappling hook has been released
        else if (returningGrapple) {
            if (counter > 0) {
                counter--;
            }
            else {
                returningGrapple = false;
                console.log("Grappling hook has returned to player");
                // Removes the grapple line from the scene
                scene.remove(grappleLine)
                grappleLine = null;
                grappleDestination = null;
            }
        }
        // Updates the position of the grappling hook if the grappling
        // hook's line exists and the grappling hook's destination exists
        // TODO bug fix
        if (grappleLine != null && grappleDestination != null) {
            // const positions = new Float32Array((delay * pointScale) * 3); // 3 because point is 3D
            // const origin = grappleOrigin.getWorldPosition(new Vector3());
            // const direction = new Vector3().subVectors(grappleDestination, origin).normalize();
            // updateLinePositions(positions, origin, direction);
            // grappleLine.geometry.setPositions(positions);
            grappleLine.geometry.maxInstancedCount = counter * pointScale;
        }
        /////////////////////////////////////////////
    }
    prevTime = time;
    renderer.render(scene, camera);
    scene.update && scene.update(time);
};
