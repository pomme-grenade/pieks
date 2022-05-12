import * as THREE from "three";
import { gltfLoader } from "./player.js";
import { loader } from "./card.js";

export const worldTexture = await new Promise((res) => {
  loader.load("./assets/baked/cliff_bake_4k.png", res);
});
worldTexture.flipY = false;

export const stoneTexture = await new Promise((res) => {
  loader.load("./assets/baked/stones_bake.png", res);
});
stoneTexture.flipY = false;

export const treeTexture = await new Promise((res) => {
  loader.load("./assets/baked/tree_baked_big.png", res);
});
treeTexture.flipY = false;

export async function createWorld() {
  const worldGroup = await new Promise((res, rej) => {
    gltfLoader.load("./assets/models/cliff.glb", (gltf) => {
      const scene = gltf.scene;
      scene.scale.set(2, 2, 2);
      scene.position.x += 1.5
      scene.position.y -= 1
      scene.frustumCulled = false
      scene.rotation.x = Math.PI / 2;
      res(scene);
    });
  });
  return worldGroup;
}

export async function createStones() {
  const stoneGroup = await new Promise((res, rej) => {
    gltfLoader.load("./assets/models/stones.glb", (gltf) => {
      const scene = gltf.scene;
      scene.scale.set(2, 2, 2);
      scene.position.x += 1.5
      scene.position.y -= 1
      scene.rotation.x = Math.PI / 2;
      res(scene);
    });
  });
  return stoneGroup;
}

