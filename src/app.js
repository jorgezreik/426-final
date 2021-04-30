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

import { WebGLRenderer, PerspectiveCamera, Vector3, Raycaster, Geometry, Line, LineBasicMaterial } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { SeedScene } from 'scenes';


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
let initGrapple = false; // True when grapple should be initiated
let isGrappling = false; // Whenever the player is grappling
let movingTowardGrapple = false;
let delay = 20; // number of timesteps before grappling
let counter = 0; // counter to keep track of the current delay
let grappleDist = 20;
let grappleHookPos = new Vector3();
let grappleRaycaster;

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

function init() {
    // Initializes the scene
    scene = new SeedScene();

    // Initializes the camera and pointer lock controls
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
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
            if (event.button == 0) {

                // Sets the origin of the ray to be the camera's position in world space
                camera.getWorldPosition(grappleRaycaster.ray.origin);
                // Sets the ray's direction to be the camera's look vector in world space
                camera.getWorldDirection(grappleRaycaster.ray.direction);

                // Creates a black line to visualize the ray cast
                var geometry = new Geometry();
                geometry.vertices.push(grappleRaycaster.ray.origin);
                geometry.vertices.push(grappleRaycaster.ray.origin.clone().addScaledVector(grappleRaycaster.ray.direction, grappleDist));
                var material = new LineBasicMaterial( { color : 0x000000 } );
                var line = new Line( geometry, material );
                scene.add( line );

                // Determines if the grapple hook intersects with any objects
                const grappleInters = grappleRaycaster.intersectObjects(objects);
                if (grappleInters.length > 0) {
                    grappleDist.copy(grappleInters[0].point);
                    initGrapple = true;
                    isGrappling = false;
                    counter = 0;
                    console.log("init grapple");
                }

            }
            // Other mouse clicks
            else if (isGrappling) {
                movingTowardGrapple = true;
                console.log("moving toward grapple");
            }
        }
        else controls.lock();

        
    }

    const onMouseUp = (event) => {
        if (controls.isLocked) {
            // Left click
            if (event.button == 0 && (initGrapple || isGrappling)) {
                initGrapple = false;
                isGrappling = false;
                movingTowardGrapple = false;
                console.log("release grapple");
            }
            // Other mouse clicks
            else if (isGrappling) {
                movingTowardGrapple = false;
                console.log("not moving toward grapple");
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

    const timeStamp = performance.now();

    if ( controls.isLocked === true ) {
        /////////////////////////////////////////////
        if (counter > delay && initGrapple) {
            initGrapple = false;
            isGrappling = true;
            console.log("is grappling");
        }
        else counter++;
        /////////////////////////////////////////////

        // Uses raycasting to determine if the player's
        // feet are on the ground to prevent infinite jumping
        // *** This doesn't account for the camera's roation
        feetRaycaster.ray.origin.copy(controls.getObject().position);
        feetRaycaster.ray.origin.y -= 10;
        const feetInters = feetRaycaster.intersectObjects(objects);
        const grounded = feetInters.length > 0;

        const delta = ( timeStamp - prevTime ) / 1000;

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

    }
    prevTime = timeStamp;
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
};
