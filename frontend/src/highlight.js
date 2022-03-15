import * as THREE from "three";
import vert from "./shaders/highlight/vertex.glsl?raw";
import frag from "./shaders/highlight/fragment.glsl?raw";

export function createHighlights() {
  const geometry = new THREE.BoxGeometry(0.4, 1, 0.2);
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    uniforms: {
      uWorldCameraPos: { value: new THREE.Vector3() },
    },
  });

  const leftMoveHighlight = new THREE.Mesh(geometry, material);
  const rightMoveHighlight = new THREE.Mesh(geometry, material);

  leftMoveHighlight.position.z += 0.1;
  rightMoveHighlight.position.z += 0.1;

  leftMoveHighlight.visible = false;
  rightMoveHighlight.visible = false;

  return { left: leftMoveHighlight, right: rightMoveHighlight };
}

export function updateHighlights(highlights, posLeft, posRight) {
  if (posLeft) {
    highlights["left"].position.x = posLeft;
    highlights["left"].visible = true;
  } else {
    highlights["left"].visible = false;
  }
  if (posRight) {
    highlights["right"].position.x = posRight;
    highlights["right"].visible = true;
  } else {
    highlights["right"].visible = false;
  }
}

export function resetHighlights(highlights) {
  highlights["right"].visible = false;
  highlights["left"].visible = false;
}

export function getHighlightMeshes() {
  return [leftMoveHighlight, rightMoveHighlight];
}
