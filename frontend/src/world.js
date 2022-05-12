import * as THREE from "three";
import { gltfLoader } from "./player.js";
import { loader } from "./card.js";

import cliffBakeUrl from "../assets/baked/cliff_bake_stones.png";
import stonesBakeUrl from "../assets/baked/stones_bake.png";
import treeBakeUrl from "../assets/baked/tree_baked_big.png";
import cliffModelUrl from "../assets/models/cliff.glb";
import stonesModelUrl from "../assets/models/stones.glb";

export const worldTexture = await new Promise((res) => {
  loader.load(cliffBakeUrl, res);
});
worldTexture.flipY = false;

export const stoneTexture = await new Promise((res) => {
  loader.load(stonesBakeUrl, res);
});
stoneTexture.flipY = false;

export const treeTexture = await new Promise((res) => {
  loader.load(treeBakeUrl, res);
});
treeTexture.flipY = false;

export async function createWorld() {
  const worldGroup = await new Promise((res, rej) => {
    gltfLoader.load(cliffModelUrl, (gltf) => {
      const scene = gltf.scene;
      scene.scale.set(2, 2, 2);
      scene.position.x += 1.5;
      scene.position.y -= 1;
      scene.frustumCulled = false;
      scene.rotation.x = Math.PI / 2;
      res(scene);
    });
  });
  return worldGroup;
}

export async function createStones() {
  const stoneGroup = await new Promise((res, rej) => {
    gltfLoader.load(stonesModelUrl, (gltf) => {
      const scene = gltf.scene;
      scene.scale.set(2, 2, 2);
      scene.position.x += 1.5;
      scene.position.y -= 1;
      scene.rotation.x = Math.PI / 2;
      res(scene);
    });
  });
  return stoneGroup;
}
