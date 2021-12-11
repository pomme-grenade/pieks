import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { range } from "lodash";
import { Vector3 } from "three";
import { startSockets } from "./web_sockets.js";

startSockets();

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

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

const fieldCount = 23;
const fieldWidth = 0.4;
function cardXPosition(i) {
  return (i - Math.floor(fieldCount / 2)) * fieldWidth * 1.1;
}

// playing field
for (let i of range(fieldCount)) {
  const geometry = new THREE.PlaneGeometry(fieldWidth, 1);
  let color = 0xffff00;
  if (i === 11) {
    color = 0xffa000;
  }
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.x = cardXPosition(i);
  scene.add(plane);
}

// players
const playerHeight = 0.2;
for (let i of [0, 22]) {
  const geometry = new THREE.CylinderGeometry(0.15, 0.15, playerHeight);
  const material = new THREE.MeshBasicMaterial({ color: 0xfafafa });
  const cube = new THREE.Mesh(geometry, material);
  cube.rotation.x = Math.PI / 2;
  cube.position.x = cardXPosition(i);
  cube.position.z = playerHeight / 2;
  scene.add(cube);
}

// cards
const cardWidth = 1;
const cardHeight = 1.4;
const cardCount = 5;
for (let i of range(0, cardCount)) {
  const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.position.y = -2;
  plane.position.x = (i - Math.floor(cardCount / 2)) * cardWidth * 1.1;
  scene.add(plane);
}

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

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
