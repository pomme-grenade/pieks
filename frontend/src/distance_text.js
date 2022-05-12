import {
  BufferGeometry,
  CanvasTexture,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import * as THREE from "three";
import colors from "./colors";

export function createCanvasTexture() {
  const ctx = document.createElement("canvas").getContext("2d");
  document.body.appendChild(ctx.canvas);
  ctx.canvas.width = 256;
  ctx.canvas.height = 256;
  ctx.font = "100px sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#3c3836";
  const texture = new CanvasTexture(ctx.canvas);
  return new MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.FrontSide,
  });
}

/**
 *
 * @param {THREE.Vector3} leftPlayerPos
 * @param {THREE.Vector3} rightPlayerPos
 * @returns
 */
export function createDistanceText(leftPlayerPos, rightPlayerPos) {
  const mat = createCanvasTexture();
  const geom = new PlaneGeometry(0.5, 0.5);
  const textMesh = new Mesh(geom, mat);
  textMesh.position.y = -0.85;

  const lines = [leftPlayerPos, rightPlayerPos].map((pos) => {
    const lineMat = new LineBasicMaterial({ color: colors.blackLight });
    const lineGeom = new BufferGeometry().setFromPoints(
      getLinePoints(pos, textMesh.position)
    );
    return new Line(lineGeom, lineMat);
  });

  return {
    textMesh,
    lines,
  };
}

function getLinePoints(playerPosition, centerPosition) {
  return [
    new Vector3(playerPosition.x, centerPosition.y + 0.2, 0),
    new Vector3(playerPosition.x, centerPosition.y, 0),
    new Vector3(
      centerPosition.x + Math.sign(playerPosition.x) * 0.2,
      centerPosition.y,
      0
    ),
  ];
}

/**
 *
 * @param {THREE.Mesh} textMesh
 */
export function updateDistanceText(
  { textMesh, lines },
  newDistance,
  leftPlayerPos,
  rightPlayerPos
) {
  const ctx = textMesh.material.map.image.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillText(newDistance, ctx.canvas.width / 2, ctx.canvas.height / 2);
  textMesh.material.map.needsUpdate = true;
  lines[0].geometry.setFromPoints(
    getLinePoints(leftPlayerPos, textMesh.position)
  );
  lines[1].geometry.setFromPoints(
    getLinePoints(rightPlayerPos, textMesh.position)
  );
}
