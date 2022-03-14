import * as THREE from "three";
import { gltfLoader } from "./player.js";
import { loader } from "./card.js";

export const worldTexture = await new Promise((res) => {
  loader.load("./assets/baked/cliff_bake.png", res);
});
worldTexture.flipY = false;

export const treeTexture = await new Promise((res) => {
  loader.load("./assets/baked/trees_bake.png", res);
});
treeTexture.flipY = false;

export async function createWorld() {
  const worldGroup = await new Promise((res, rej) => {
    gltfLoader.load("./assets/models/cliff.glb", (gltf) => {
      const scene = gltf.scene;
      scene.scale.set(2, 2, 2);
      scene.position.x += 2
      scene.position.y -= 1
      scene.frustumCulled = false
      scene.rotation.x = Math.PI / 2;
      res(scene);
    });
  });
  return worldGroup;
}