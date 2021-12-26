import { isEqual, pull, pullAt } from "lodash";
import * as THREE from "three";
import { createCards, raycastCards, updateCards } from "./card";
import colors from "./colors";
import {
  createFieldTiles,
  createPlayers,
  resetFieldColors,
  updatePlayers,
} from "./field";
import "./style.css";
import { updateText } from "./text";

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let currentState = null;
let selectedCards = [];
let selectedCardMeshes = [];

const fieldGroup = createFieldTiles();
const playerMeshes = createPlayers();

let camera;
let cardGroup;
let sendMessage;

export async function initGame(scene, cam, onSendMessage) {
  camera = cam;
  scene.add(...fieldGroup);
  scene.add(...playerMeshes);

  cardGroup = await createCards();
  scene.add(cardGroup);

  sendMessage = onSendMessage;
}

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener("mousemove", onMouseMove, false);

export function updateGame(dt) {
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mousePosition, camera);

  for (let card of cardGroup.children) {
    card.material.color.set(colors.white);
  }

  if (currentState) {
    for (let [mesh, number] of raycastCards(raycaster, cardGroup)) {
      if (
        selectedCardMeshes.includes(mesh) ||
        getLegalMoves([...selectedCards, number]).length > 0
      ) {
        mesh.material.color.set(colors.purple);
      }
    }
  }
}

export function updateState(newState, playerId, text) {
  currentState = newState;
  updateCards(cardGroup.children, newState.own_hand);
  updatePlayers(playerMeshes, [newState.own_pos, newState.other_pos]);
  playerMeshes[0].material.color = new THREE.Color(colors.greenLight);

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

  const dirToOther = Math.sign(currentState.other_pos - playerPos);
  const legalMoves = getLegalMoves(selectedCards);
  if (legalMoves.includes("moveLeft")) {
    fieldGroup[playerPos - selectedCards[0]].material.color.set(colors.red);
  }
  if (legalMoves.includes("moveRight")) {
    fieldGroup[playerPos + selectedCards[0]].material.color.set(colors.red);
  }
  if (legalMoves.includes("attack") || legalMoves.includes("jumpAttack")) {
    fieldGroup[playerPos + selectedCards[0] * dirToOther].material.color.set(
      colors.red
    );
  }
  if (legalMoves.includes("parry")) {
    fieldGroup[playerPos].material.color.set(colors.green);
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

window.addEventListener("click", onMouseClick, false);
