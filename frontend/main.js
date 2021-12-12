import "./style.css";
import { v4 as uuidv4 } from "uuid";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Vector3 } from "three";
import { startSockets } from "./web_sockets.js";
import { createCards, updateCards } from "./card";
import {
  createFieldTiles,
  createPlayers,
  resetFieldColors,
  updatePlayers,
} from "./field";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");
const text = document.querySelector("#text");

const playerId = uuidv4();

// Scene
const scene = new THREE.Scene();

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let currentState = null;
let selectedCards = [];
let selectedAction = null;

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

const fieldGroup = createFieldTiles();
scene.add(...fieldGroup);
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

  if (currentState) {
    // calculate objects intersecting the picking ray
    const cardIntersects = raycaster.intersectObjects(cardGroup.children);

    let cards = new Set(
      currentState.next_moves.map((move) => move.cards).flat()
    );

    for (let intersect of cardIntersects) {
      const number = intersect.object.userData.number;
      if (typeof number !== "undefined" && cards.has(number)) {
        intersect.object.material.color.set(0xff0000);
      }
    }
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
  currentState = newState;
  updateCards(cardGroup.children, newState.own_hand);
  updatePlayers(playerMeshes, [newState.own_pos, newState.other_pos]);
  playerMeshes[0].material.color = new THREE.Color(0x5050ff);

  let textContent = "";

  if (newState.current_player === playerId) {
    textContent += `Your turn`;
  } else {
    textContent += `Other player's turn`;
  }

  if (newState.last_action?.action == "attack") {
    textContent += ", you were attacked!";
  } else if (newState.last_action?.action == "jumpAttack") {
    textContent += ", you were attacked indirectly!";
  }

  const distance = Math.abs(newState.other_pos - newState.own_pos);
  textContent += ` - distance: ${distance}`;

  text.textContent = textContent;
}

function getLegalMoves(cards) {
  const moves = [];
  for (let move of currentState.next_moves) {
    if (cards[0] == move.cards[0]) {
      moves.push(move.action);
    }
  }
  return moves;
}

const sendMessage = startSockets(playerId, updateState);
text.textContent = "Finding a match...";

function onMouseClick(event) {
  const playerPos = currentState.own_pos;

  const cardIntersects = raycaster
    .intersectObjects(cardGroup.children)
    // Pick only objects that are cards (meaning they have a number)
    .filter((o) => typeof o.object.userData.number !== "undefined");

  for (let intersect of cardIntersects) {
    let number = intersect.object.userData.number;
    selectedCards = [number];
    resetFieldColors(fieldGroup);
  }

  if (selectedCards.length > 0) {
    const legalMoves = getLegalMoves(selectedCards);
    if (legalMoves.includes("moveLeft")) {
      fieldGroup[playerPos - selectedCards[0]].material.color.set(0xff0000);
    }
    if (legalMoves.includes("moveRight")) {
      fieldGroup[playerPos + selectedCards[0]].material.color.set(0xff0000);
    }
    if (legalMoves.includes("attack")) {
      fieldGroup[playerPos + selectedCards[0]].material.color.set(0xff0000);
    }
  }

  const fieldIntersects = raycaster.intersectObjects(fieldGroup);

  if (selectedCards.length != 0) {
    for (let intersect of fieldIntersects) {
      const fieldPos = intersect.object.userData.pos;
      const distance = fieldPos - playerPos;
      const dir = Math.sign(distance);

      if (dir == -1) {
        selectedAction = "moveLeft";
      } else if (dir == 1) {
        selectedAction = "moveRight";
      }

      resetFieldColors(fieldGroup);

      sendMessage({
        action: selectedAction,
        cards: selectedCards,
      });
      selectedCards = [];
      selectedAction = null;
    }
  }
}

window.addEventListener("click", onMouseClick, false);
