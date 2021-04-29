/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';

// Initialize core ThreeJS components
const scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(6, 3, -10);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.update();

// Render loop
const onAnimationFrameHandler = (timeStamp) => {

    /////////////////////////////////////////////
    if (counter > delay && initGrapple) {
        initGrapple = false;
        isGrappling = true;
        console.log("is grappling");
    }
    else counter++;
    /////////////////////////////////////////////

    controls.update();
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);


/////////////////////////////////////////////////////////////////////
// First draft of event listeners

var initGrapple = false; // Whenever the raycast should be initialized
var isGrappling = false; // Whenever the grappling is happening
var delay = 20; // number of timesteps before the grapple is initialized
var counter = 0; // counter to keep track of the current delay
var grappleRay;
// For grappling
const initiateGrapplingHook = (event) => {
    // Left click
    if (event.button == 0) {
        const pos = camera.position;
        const direction = new Vector3();
        camera.getWorldDirection(direction);
        grappleRay = {origin: pos, direction: direction};
        console.log(grappleRay);
        initGrapple = true;
        isGrappling = false;
        counter = 0;
        console.log("init grapple");
    }
    // Other mouse clicks
    else if (isGrappling) {
        movingTowardGrapple = true;
        console.log("moving toward grapple");
    }
    
}

window.addEventListener('mousedown', initiateGrapplingHook, false);

const releaseGrapplingHook = (event) => {
        // Left click
    if (event.button == 0) {
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
window.addEventListener('mouseup', releaseGrapplingHook, false);

var moveSpeed = 1;
// var jumpSpeed = 1;
// var isJumping = false;
var movingTowardGrapple = false;

const handlePlayerMovement = (event) => {
    const keyMap = {
        // Forward
        "ArrowUp": new Vector3(0, 0, moveSpeed),
        "w": new Vector3(0, 0, moveSpeed),
        // Left
        "ArrowLeft": new Vector3(moveSpeed, 0, 0),
        "a": new Vector3(moveSpeed, 0, 0),
        // Backward
        "ArrowDown": new Vector3(0, 0, -moveSpeed),
        "s": new Vector3(0, 0, -moveSpeed),
        // Right
        "ArrowRight": new Vector3(-moveSpeed, 0, 0),
        "d": new Vector3(-moveSpeed, 0, 0),
    }
    const vec = keyMap[event.key];
    console.log(vec);

    // Still need to handle jumping when pressing spacebar.
    // Still need to handle moving towards grapple when
    // pressing shift.
}
window.addEventListener('keydown', handlePlayerMovement, false);
/////////////////////////////////////////////////////////////////////
