import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { loader } from "./card.js";
import colors from "./colors";
import { tileXPosition } from "./field.js";

import gazelleBakeUrl from "../assets/baked/gazelle_bake.png";
import gazelleModelUrl from "../assets/models/gazelle.glb";

export const dogTexture = await new Promise((res) => {
  loader.load(gazelleBakeUrl, res);
});
dogTexture.flipY = false;

export const gltfLoader = new GLTFLoader();

export async function createPlayers() {
  const playerHeight = 0.2;

  const playerGroup = await new Promise((res, rej) => {
    gltfLoader.load(gazelleModelUrl, (gltf) => {
      gltf.scene.scale.set(0.12, 0.12, 0.12);
      res(gltf.scene);
    });
  });
  return [0, 22].map((i) => {
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, playerHeight);
    const material = new THREE.MeshBasicMaterial({ color: colors.green });
    //const cube = new THREE.Mesh(geometry, material);
    const player = playerGroup.clone();

    player.rotation.x = Math.PI / 2;
    player.position.z = playerHeight / 2;
    return player;
  });
}
