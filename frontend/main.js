import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { initGame, updateGame, updateState } from "./game.js";
import {
  createMenuScene,
  createGameOverScene,
  createTextGeometry,
} from "./scenes";
import { startSockets } from "./web_sockets.js";
import colors from "./colors";
import "./style.css";
import { getInstructions } from "./instructions.js";
import { getPlayerId } from "./player_id.js";

const canvas = document.querySelector("canvas.webgl");
const statusText = document.querySelector("#status");
const instructionText = document.querySelector("#instructions");

// Scene
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(colors.background);

// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = -1;
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target = new Vector3(0, -0.5, 0);
controls.enableDamping = true;

/**
 * Animate
 */
const clock = new THREE.Clock();
let lastElapsedTime = 0;

const playerId = getPlayerId();

function onServerUpdate(info) {
  if (info["event"] === "game_start") {
    currentScene = "game";
  } else if (info["event"] === "game_over") {
    // currentScene = "game";
    const hasWon = info["winner"] === playerId;
    const description = hasWon ? "w i n" : "l o s e";
    currentScene = "gameOver";
    scenes[currentScene].add(
      new THREE.Mesh(
        createTextGeometry(description),
        new THREE.MeshStandardMaterial({ color: colors.orange })
      )
    );
  } else if (info["event"] === "other_player_disconnected") {
    statusText.textContent =
      "Other player lost their connection to the server. Waiting for them to reconnect...";
  } else if (info["event"] === "connection_lost") {
    statusText.textContent = "Lost connection to server. Reconnecting...";
  } else if (info["event"]) {
    console.warn("unhandled event received:", info["event"]);
  } else {
    updateState(info, playerId, statusText);
    instructionText.textContent = getInstructions(info, playerId);
  }
}

const sendMessage = startSockets(playerId, onServerUpdate);
statusText.textContent = "Finding a match...";

await initGame(scene, camera, sendMessage);
const scenes = {
  menu: createMenuScene(camera),
  game: scene,
  gameOver: createGameOverScene(),
};

let currentScene = "menu";

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;

  //updateUniforms(camera.position);
  // Update controls
  controls.update();

  // Render

  if (currentScene === "menu") {
    renderer.render(scenes.menu, camera);
  } else if (currentScene === "gameOver") {
    renderer.render(scenes.gameOver, camera);
  } else {
    updateGame(deltaTime);
    renderer.render(scenes.game, camera);
  }

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
