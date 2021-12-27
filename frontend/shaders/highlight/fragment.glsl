varying vec2 vUv;
varying vec3 vFragNormal;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

float rim(vec3 normal, vec3 viewDir) {
	float rimAmt = 1. - max(0., dot(normal, -viewDir));
	rimAmt = pow(rimAmt, 2.);
	return rimAmt;
}

void main() {
	//vec3 viewDir = normalize(vWorldPos - uWorldCameraPos);
	vec3 center = vec3(0.);

	vec3 localPos = vec3(vLocalPos.x / 0.4, vLocalPos.y, vLocalPos.z / 0.2);
	float amp = length(localPos - center);
	amp = pow(amp, 6.) * 4.;
	vec3 rimColor = vec3(0.839, 0.364, 0.054);

	gl_FragColor = vec4(vec3(rimColor), amp);
}
