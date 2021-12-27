import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import helvetica from "./assets/fonts/helvetiker_regular.typeface.json";
import colors from "./colors";

const loader = new FontLoader();

const font = loader.parse(helvetica);

const geometry = createTextGeometry(". s e a r c h i n g  g a m e .");
const material = new THREE.MeshStandardMaterial({ color: colors.orange });

const fontMesh = new THREE.Mesh(geometry, material);
fontMesh.position.x -= 4;

export function createMenuScene() {
  const scene = new THREE.Scene();
  const ambientLight = new THREE.AmbientLight(0x262837, 3);

  const directionalLight = new THREE.DirectionalLight(0x404040, 2);
  directionalLight.position.y = 3;
  directionalLight.position.z = 3;

  scene.add(ambientLight, directionalLight);
  scene.add(fontMesh);
  return scene;
}

export function createGameOverScene() {
  const scene = new THREE.Scene();
  const ambientLight = new THREE.AmbientLight(0x262837, 3);

  const directionalLight = new THREE.DirectionalLight(0x404040, 2);
  directionalLight.position.y = 3;
  directionalLight.position.z = 3;

  scene.add(ambientLight, directionalLight);

  return scene;
}

export function createTextGeometry(text) {
  return new TextGeometry(text, {
    font: font,
    size: 0.5,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 10 / 160,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 5,
  });
}
