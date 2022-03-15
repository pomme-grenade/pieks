varying vec2 vUv;
varying vec3 vFragNormal;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
	vec3 localPos = position;

	vec4 pos = modelMatrix * vec4(localPos, 1.);

	gl_Position = projectionMatrix * viewMatrix * pos;

	vUv = uv;
	vFragNormal = normal;
	vWorldPos = pos.xyz;
	vLocalPos = localPos;
}
