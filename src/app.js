/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera } from 'three';
import { PlayerController, CameraController } from 'controllers';
import { SeedScene } from 'scenes';
import { GemGenerator } from 'objects';
import "./styles.css";

// Appends the link for the Google font on top (a bit WIP)
let link1 = document.createElement('link');
link1.setAttribute('rel', 'stylesheet');
link1.setAttribute('type', 'text/css');
link1.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Major+Mono+Display&family=Montserrat&family=Share+Tech+Mono');
document.head.appendChild(link1);


let _isMenu = true;

let rootDiv = document.createElement("DIV");
rootDiv.id = "rootDiv"
document.body.appendChild(rootDiv);

// Creates a separate div for the main menu
// that can be hidden once the game starts
let menuDiv = document.createElement("DIV");
menuDiv.id = "menuDiv"
rootDiv.appendChild(menuDiv);

const scene = new SeedScene();
const renderer = new WebGLRenderer({ antialias: true });

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
rootDiv.prepend(canvas);

// Initialize controllers
const cameraController = new CameraController(scene);
let playerController = null;
let gemGenerator = null;

// Sets up the score span
let scoreSpan = document.createElement("SPAN");
scoreSpan.innerHTML = "SCORE: 0";
scoreSpan.id = "scoreSpan";
scoreSpan.hidden = true;
rootDiv.appendChild(scoreSpan);

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    if (!_isMenu) {
        playerController.update(timeStamp);
        gemGenerator.update(timeStamp);
        scoreSpan.innerHTML = "SCORE: " + playerController.score;
    }
    renderer.render(scene, cameraController.camera);
    scene?.update(timeStamp, _isMenu);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);


cameraController.camera.position.set(-90, 0, -90);
cameraController.camera.lookAt(50,0,0)

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    cameraController.handleResize(innerWidth, innerHeight);
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);


function initMenu() {
    
    // Adds the title to the screen
    let titleSpan = document.createElement("SPAN");
    titleSpan.innerHTML = "CORE CRAWLER";
    titleSpan.id = "title";
    menuDiv.appendChild(titleSpan);

    // Adds the play button to the screen
    let playBtn = document.createElement("BUTTON");
    playBtn.innerHTML = "Play Game";
    playBtn.id = "playButton"
    playBtn.onclick = function() {
        playerController = new PlayerController(cameraController, canvas, document, scene);
        gemGenerator = new GemGenerator(playerController, scene);
        scoreSpan.hidden = false;

        let reticle = document.createElement("SPAN");
        reticle.innerHTML = "circle";
        reticle.classList.add("material-icons-outlined") 
        reticle.id = "reticle";
        rootDiv.appendChild(reticle);
    
        menuDiv.remove();
        _isMenu = false;
    };
    menuDiv.appendChild(playBtn);

    // Adds the title to the screen
    let instSpan = document.createElement("SPAN");
    instSpan.innerHTML = `<strong>Welcome, Astronaut!</strong><br><br> You have been tasked to collect gems inside 
    this hollow planet. But don't worry, we're not sending you in there with your hands empty.
    While inside, you will be able to use your nifty grappling hook.<br><br>To fire the hook,
    all you need to do is <strong>left-click</strong>. Once the hook has latched on some terrain, you
    can <strong>right-click</strong> or press <strong>shift</strong> to get a boost towards the hook. To move around, you can
    use <strong>WASD</strong> or the <strong>arrow keys</strong>. You can also move upwards with the <strong>spacebar.</strong><br><br> Alright, enough
    chitchat. Now get in there!`;
    instSpan.hidden = true;
    instSpan.classList.add("infoSpan")
    menuDiv.appendChild(instSpan);

    let creditsSpan = document.createElement("SPAN");
    creditsSpan.innerHTML = `Made by <strong>Jorge Zreik</strong> and <strong>Epi Torres</strong> for COS 426!<br><br>
    <strong>References</strong>:<br>
    https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene<br>
    https://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically/31411794#31411794<br>
    https://github.com/mrdoob/three.js/blob/master/examples/webgl_lines_fat.html<br>
    https://github.com/mrdoob/three.js/blob/master/examples/physics_ammo_rope.html<br>
    https://www.color-hex.com/color-palette/25406<br>
    https://blog.jakoblind.no/css-modules-webpack/<br>
    https://stackoverflow.com/questions/32896628/how-to-generate-random-integers-which-are-multiples-of-30-in-javascript<br>
    https://stackoverflow.com/questions/982054/how-to-center-an-element-in-the-middle-of-the-browser-window<br>
    https://www.npmjs.com/package/material-icons<br>
    https://chriscourses.com/blog/loading-fonts-webpack<br>
    http://paulbourke.net/geometry/polygonise/`;
    creditsSpan.hidden = true;
    creditsSpan.classList.add("infoSpan");
    creditsSpan.style.fontSize = "1vw";
    menuDiv.appendChild(creditsSpan);

    // Adds the settings button to the screen
    let instBtn = document.createElement("BUTTON");
    instBtn.innerHTML = "Instructions";
    instBtn.id = "instButton"
    instBtn.onclick = function() {
        creditsSpan.hidden = true;
        instSpan.hidden = !instSpan.hidden;
    };
    menuDiv.appendChild(instBtn);

    
    // Adds the credits to the screen
    let creditsBtn = document.createElement("BUTTON");
    creditsBtn.innerHTML = "Credits";
    creditsBtn.id = "creditsButton"
    creditsBtn.onclick = function() {
        instSpan.hidden = true;
        creditsSpan.hidden = !creditsSpan.hidden;
    };
    menuDiv.appendChild(creditsBtn);

}

initMenu();
