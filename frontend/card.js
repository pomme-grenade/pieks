import url1 from "./assets/1.png";
import url2 from "./assets/2.png";
import url3 from "./assets/3.png";
import url4 from "./assets/4.png";
import url5 from "./assets/5.png";
import { range, zip } from "lodash";
import * as THREE from "three";

const loader = new THREE.TextureLoader();
const textures = await Promise.all(
  [url1, url2, url3, url4, url5].map(
    (url) => new Promise((res) => loader.load(url, res))
  )
);
const cardWidth = 1;
const cardHeight = 1.4;

function cardXPosition(i, total) {
  return (i - (total - 1) / 2) * cardWidth * 1.1;
}

export async function createCards() {
  const cardCount = 5;
  const cardGroup = new THREE.Group();
  for (let i of range(0, cardCount)) {
    const bgMesh = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });
    const card = new THREE.Mesh(bgMesh, bgMat);
    card.position.y = -2;
    card.position.x = cardXPosition(i, cardCount);
    // invisible until the game starts: `updateCards` will then
    // make the cards visible
    card.visible = false;

    const textMesh = new THREE.PlaneGeometry(cardWidth, cardWidth);
    const textMat = new THREE.MeshBasicMaterial({
      map: textures[i],
      transparent: true,
    });
    const textPlane = new THREE.Mesh(textMesh, textMat);
    textPlane.position.z += 0.1;
    card.add(textPlane);
    cardGroup.add(card);
  }
  return cardGroup;
}

/**
 * @param {THREE.Mesh[]} meshes
 * @param {number[]} state
 */
export function updateCards(meshes, state) {
  // update visibility and positioning of cards
  for (let [i, mesh] of meshes.entries()) {
    if (i < state.length) {
      mesh.visible = true;
      mesh.position.x = cardXPosition(i, state.length);
      mesh.userData.number = state[i];
      meshes[i].children[0].material.map = textures[state[i] - 1];
    } else {
      mesh.visible = false;
      mesh.userData.number = null;
    }
  }
}

export function raycastCards(raycaster, cardGroup) {
  // calculate objects intersecting the picking ray
  const cardIntersects = raycaster.intersectObjects(cardGroup.children);
  return cardIntersects
    .map((intersect) => [intersect.object, intersect.object.userData.number])
    .filter(([_, number]) => number !== undefined);
}
