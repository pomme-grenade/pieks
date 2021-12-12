import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Vector3 } from "three";
import { startSockets } from "./web_sockets.js";
import { createCards, updateCards } from "./card";
import { createFieldTiles, createPlayers, updatePlayers } from "./field";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

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

scene.add(...createFieldTiles());
const playerMeshes = createPlayers();
scene.add(...playerMeshes);

const cardGroup = await createCards();
scene.add(cardGroup);

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener("mousemove", onMouseMove, false);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let lastElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mousePosition, camera);

  for (let card of cardGroup.children) {
    card.material.color.set(0xffffff);
  }

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(cardGroup.children);

  for (let intersect of intersects) {
    intersect.object.material.color.set(0xff0000);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

function updateState(newState) {
  updateCards(cardGroup.children, newState.own_hand);
  updatePlayers(playerMeshes, [newState.own_pos, newState.other_pos]);
}

const sendMessage = startSockets(updateState);

function onMouseClick(event) {
  const intersects = raycaster
    .intersectObjects(cardGroup.children)
    // Pick only objects that are cards (meaning they have a number)
    .filter((o) => typeof o.object.userData.number !== "undefined");

  for (let intersect of intersects) {
    let number = intersect.object.userData.number;
    sendMessage({
      action: "moveLeft",
      cards: [number],
    });
  }
}

window.addEventListener("click", onMouseClick, false);
