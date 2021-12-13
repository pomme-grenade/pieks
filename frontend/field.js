import { range } from "lodash";
import * as THREE from "three";
import colors from "./colors";

const fieldCount = 23;
const fieldWidth = 0.4;
function tileXPosition(i) {
  return (i - Math.floor(fieldCount / 2)) * fieldWidth * 1.1;
}

export function createFieldTiles() {
  let meshes = range(fieldCount).map((i) => {
    const geometry = new THREE.PlaneGeometry(fieldWidth, 1);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.x = tileXPosition(i);
    plane.userData.pos = [i];
    return plane;
  });
  resetFieldColors(meshes);
  return meshes;
}

export function createPlayers() {
  const playerHeight = 0.2;
  return [0, 22].map((i) => {
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, playerHeight);
    const material = new THREE.MeshBasicMaterial({ color: colors.green });
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

export function resetFieldColors(tiles) {
  for (let [i, tile] of tiles.entries()) {
    let color = i === 11 ? colors.yellowLight : colors.yellow;
    tile.material.color.set(color);
  }
}
