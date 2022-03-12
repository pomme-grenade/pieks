import { range } from "lodash";
import * as THREE from "three";
import colors from "./colors";

const fieldCount = 23;
const fieldWidth = 0.4;
export function tileXPosition(i) {
  return (i - Math.floor(fieldCount / 2)) * fieldWidth * 1.1;
}

export function createFloor() {
  const geom = new THREE.PlaneGeometry(100, 100);
  const mat = new THREE.MeshBasicMaterial({ color: colors.background });
  const plane = new THREE.Mesh(geom, mat);
  plane.position.z -= 1;
  return plane;
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

/**
 *
 * @param {THREE.Mesh[]} meshes
 * @param {number[]} state
 */
export function updatePlayers(meshes, state) {
  for (let [i, pos] of state.entries()) {
    meshes[i].position.x = tileXPosition(pos);
    if (meshes[0].position.x < meshes[1].position.x) {
      meshes[0].rotation.y = Math.PI;
    } else {
      meshes[1].rotation.y = Math.PI;
    }
  }
}

export function resetFieldColors(tiles) {
  for (let [i, tile] of tiles.entries()) {
    let color = i === 11 ? colors.yellowLight : colors.yellow;
    tile.material.color.set(color);
  }
}
