import url1 from "./assets/1.png";
import url2 from "./assets/2.png";
import url3 from "./assets/3.png";
import url4 from "./assets/4.png";
import url5 from "./assets/5.png";
import { range } from "lodash";
import * as THREE from "three";

const loader = new THREE.TextureLoader();

export async function createCards() {
  const textures = await Promise.all(
    [url1, url2, url3, url4, url5].map(
      (url) => new Promise((res) => loader.load(url, res))
    )
  );
  const cardWidth = 1;
  const cardHeight = 1.4;
  const cardCount = 5;
  const cardGroup = new THREE.Group();
  for (let i of range(0, cardCount)) {
    const bgMesh = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });
    const plane = new THREE.Mesh(bgMesh, bgMat);
    plane.position.y = -2;
    plane.position.x = (i - Math.floor(cardCount / 2)) * cardWidth * 1.1;

    const textMesh = new THREE.PlaneGeometry(cardWidth, cardWidth);
    const textMat = new THREE.MeshBasicMaterial({
      map: textures[i],
      transparent: true,
    });
    const textPlane = new THREE.Mesh(textMesh, textMat);
    textPlane.position.z += 0.1;
    plane.add(textPlane);

    cardGroup.add(plane);
  }
  return cardGroup;
}
