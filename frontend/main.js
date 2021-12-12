import "./style.css";
import { v4 as uuidv4 } from "uuid";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Vector3 } from "three";
import { startSockets } from "./web_sockets.js";
import { createCards, raycastCards, updateCards } from "./card";
import {
  createFieldTiles,
  createPlayers,
  resetFieldColors,
  updatePlayers,
} from "./field";
import { updateText } from "./text";
import { isEqual, pull, pullAll, pullAt, remove } from "lodash";

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
let selectedCardMeshes = [];

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
    for (let [mesh, number] of raycastCards(raycaster, cardGroup)) {
      if (
        selectedCardMeshes.includes(mesh) ||
        getLegalMoves([...selectedCards, number]).length > 0
      ) {
        mesh.material.color.set(0xff0000);
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

function newStateReceived(newState) {
  currentState = newState;
  updateCards(cardGroup.children, newState.own_hand);
  updatePlayers(playerMeshes, [newState.own_pos, newState.other_pos]);
  playerMeshes[0].material.color = new THREE.Color(0x5050ff);

  text.textContent = updateText(newState, playerId);
}

function getLegalMoves(cards) {
  const moves = [];
  for (let move of currentState.next_moves) {
    if (isEqual(cards, move.cards)) {
      moves.push(move.action);
    }
  }
  return moves;
}

const sendMessage = startSockets(playerId, newStateReceived);
text.textContent = "Finding a match...";

function onMouseClick(_event) {
  if (currentState === null) {
    return;
  }

  const playerPos = currentState.own_pos;

  for (let [mesh, number] of raycastCards(raycaster, cardGroup)) {
    if (selectedCardMeshes.includes(mesh)) {
      // remove card from selected cards
      mesh.position.y -= 0.2;
      selectedCardMeshes = pull(selectedCardMeshes, mesh);
      // find a single matching number from our card list and remove it
      for (let [i, card] of selectedCards.entries()) {
        if (card === number) {
          pullAt(selectedCards, i);
          break;
        }
      }
    } else {
      let newSelectedCards = [...selectedCards, number];
      if (getLegalMoves(newSelectedCards).length > 0) {
        mesh.position.y += 0.2;
        resetFieldColors(fieldGroup);
        selectedCards = newSelectedCards;
        selectedCardMeshes.push(mesh);
      }
    }
    console.log("selected cards", selectedCards);
  }

  if (selectedCards.length > 0) {
    const dirToOther = Math.sign(currentState.other_pos - playerPos);
    const legalMoves = getLegalMoves(selectedCards);
    if (legalMoves.includes("moveLeft")) {
      fieldGroup[playerPos - selectedCards[0]].material.color.set(0xff0000);
    }
    if (legalMoves.includes("moveRight")) {
      fieldGroup[playerPos + selectedCards[0]].material.color.set(0xff0000);
    }
    if (legalMoves.includes("attack") || legalMoves.includes("jumpAttack")) {
      fieldGroup[playerPos + selectedCards[0] * dirToOther].material.color.set(
        0xff0000
      );
    }
    if (legalMoves.includes("parry")) {
      fieldGroup[playerPos].material.color.set(0xff000);
    }

    const fieldIntersects = raycaster.intersectObjects(fieldGroup);

    for (let intersect of fieldIntersects) {
      const fieldPos = intersect.object.userData.pos;
      const distance = fieldPos - playerPos;
      const dir = Math.sign(distance);
      let selectedAction;

      if (dir == dirToOther && legalMoves.includes("attack")) {
        selectedAction = "attack";
      } else if (legalMoves.includes("jumpAttack")) {
        selectedAction = "jumpAttack";
      } else if (legalMoves.includes("parry")) {
        selectedAction = "parry";
      } else if (dir == -1 && legalMoves.includes("moveLeft")) {
        selectedAction = "moveLeft";
      } else if (dir == 1 && legalMoves.includes("moveRight")) {
        selectedAction = "moveRight";
      } else {
        selectedAction = "skip";
      }

      if (selectedAction) {
        console.log("action", selectedAction);

        resetFieldColors(fieldGroup);

        sendMessage({
          action: selectedAction,
          cards: selectedCards,
        });
        for (let mesh of selectedCardMeshes) {
          mesh.position.y -= 0.2;
        }
        selectedCardMeshes = [];
        selectedCards = [];
        selectedAction = null;
        break;
      }
    }
  }
}

window.addEventListener("click", onMouseClick, false);
