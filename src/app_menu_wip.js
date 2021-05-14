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

let link = document.createElement('link');
link.setAttribute('rel', 'stylesheet');
link.setAttribute('type', 'text/css');
link.setAttribute('href', 'https://fonts.googleapis.com/css?family=Monoton');
document.head.appendChild(link);

let rootDiv = document.createElement("DIV");
rootDiv.id = "root"
rootDiv.style.position = "relative";
document.body.appendChild(rootDiv);


function initMenu() {
    // Creates a separate div for the main menu
    // that can be hidden once the game starts
    let menuDiv = document.createElement("DIV");
    menuDiv.id = "menuDiv"
    rootDiv.appendChild(menuDiv);
    
    // Adds the title to the screen
    let titleSpan = document.createElement("SPAN");
    titleSpan.innerHTML = "CORE CRAWLER";
    titleSpan.id = "titleSpan";
    menuDiv.appendChild(titleSpan);

    // Adds the play button to the screen
    let playBtn = document.createElement("BUTTON");
    playBtn.innerHTML = "Play Game";
    playBtn.id = "playButton"
    menuDiv.appendChild(playBtn);

    // Adds the settings button to the screen
    let settingsBtn = document.createElement("BUTTON");
    settingsBtn.innerHTML = "Settings";
    settingsBtn.id = "settingsButton"
    menuDiv.appendChild(settingsBtn);

    // Adds the credits to the screen
    let creditsBtn = document.createElement("BUTTON");
    creditsBtn.innerHTML = "Credits";
    creditsBtn.id = "creditsButton"
    menuDiv.appendChild(creditsBtn);
}



function playGame() {
    // Initialize core ThreeJS components
    const scene = new SeedScene();
    const renderer = new WebGLRenderer({ antialias: true });

    let gameDiv = document.createElement("DIV");
    gameDiv.id = "root"
    gameDiv.style.position = "relative";
    rootDiv.appendChild(gameDiv);

    // Set up renderer, canvas, and minor CSS adjustments
    renderer.setPixelRatio(window.devicePixelRatio);
    const canvas = renderer.domElement;
    canvas.style.display = 'block'; // Removes padding below canvas
    canvas.style.position = 'absolute'
    document.body.style.margin = 0; // Removes margin around page
    document.body.style.overflow = 'hidden'; // Fix scrolling
    gameDiv.appendChild(canvas);

    // Sets up the score span
    let scoreSpan = document.createElement("SPAN");
    scoreSpan.innerHTML = "Score: 0";
    scoreSpan.id = "scoreSpan";
    gameDiv.appendChild(scoreSpan);

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
        scoreSpan.innerHTML = "Score: " + playerController.score;
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
}

initMenu();
