/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
 import { WebGLRenderer } from 'three';
 import { PlayerController, CameraController } from 'controllers';
 import { SeedScene } from 'scenes';
 import { GemGenerator } from 'objects';
 import "./styles.css";
 
// Appends the link for the Google font on top (a bit WIP)
let link = document.createElement('link');
link.setAttribute('rel', 'stylesheet');
link.setAttribute('type', 'text/css');
link.setAttribute('href', 'https://fonts.googleapis.com/css?family=Monoton');
document.head.appendChild(link);

// Creates a new root div
let rootDiv = document.createElement("DIV");
rootDiv.id = "rootDiv"
document.body.appendChild(rootDiv);

let scoreSpan = document.createElement("SPAN");
scoreSpan.innerHTML = "Score: 0";
scoreSpan.id = "scoreSpan";
rootDiv.appendChild(scoreSpan);
 
 // Initialize core ThreeJS components
 const scene = new SeedScene();
 const renderer = new WebGLRenderer({ antialias: true });
 
 // Set up renderer, canvas, and minor CSS adjustments
 renderer.setPixelRatio(window.devicePixelRatio);
 const canvas = renderer.domElement;
 canvas.style.display = 'block'; // Removes padding below canvas
 canvas.style.position = 'absolute';
 document.body.style.margin = 0; // Removes margin around page
 document.body.style.overflow = 'hidden'; // Fix scrolling
 rootDiv.prepend(canvas);
 
 // Initialize controllers
 const cameraController = new CameraController(scene);
 const playerController = new PlayerController(cameraController, canvas, document, scene);
 const gemGenerator = new GemGenerator(playerController, scene);
 
 // Render loop
 const onAnimationFrameHandler = (timeStamp) => {
     playerController.update(timeStamp);
     gemGenerator.update(timeStamp);
     renderer.render(scene, cameraController.camera);
     scene?.update(timeStamp);
     window.requestAnimationFrame(onAnimationFrameHandler);
     scoreSpan.innerHTML = "Score: " + playerController.score; // updates the scoreSpan
 };
 window.requestAnimationFrame(onAnimationFrameHandler);
 
 // Resize Handler
 const windowResizeHandler = () => {
     const { innerHeight, innerWidth } = window;
     renderer.setSize(innerWidth, innerHeight);
     cameraController.handleResize(innerWidth, innerHeight);
 };
 windowResizeHandler();
 window.addEventListener('resize', windowResizeHandler, false);