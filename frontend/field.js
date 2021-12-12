import { range } from "lodash";
import * as THREE from "three";

const fieldCount = 23;
const fieldWidth = 0.4;
function tileXPosition(i) {
  return (i - Math.floor(fieldCount / 2)) * fieldWidth * 1.1;
}

export function createFieldTiles() {
  return range(fieldCount).map((i) => {
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
    plane.position.x = tileXPosition(i);
    plane.userData.pos = [i];
    return plane;
  });
}

export function createPlayers() {
  const playerHeight = 0.2;
  return [0, 22].map((i) => {
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, playerHeight);
    const material = new THREE.MeshBasicMaterial({ color: 0x404070 });
    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.x = Math.PI / 2;
    cube.position.x = tileXPosition(i);
    cube.position.z = playerHeight / 2;
    return cube;
  });
}

/**
 *
 * @param {THREE.Mesh[]} meshes
 * @param {number[]} state
 */
export function updatePlayers(meshes, state) {
  for (let [i, pos] of state.entries()) {
    meshes[i].position.x = tileXPosition(pos);
  }
}
