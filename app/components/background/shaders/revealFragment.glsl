precision mediump float;

uniform sampler2D uMaskTex;
uniform sampler2D uTopTex;
uniform sampler2D uBottomTex;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform vec2 uResolution;
uniform float uTime;
uniform float uDistortionStrength;
uniform float uEdgeGlow;
uniform float uTopTextureScale;
uniform float uTopLayerOpacity;

varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.82, 0.57, -0.57, 0.82);
  for (int i = 0; i < 3; i++) {
    value += amp * noise(p);
    p = rot * p * 2.05 + 11.4;
    amp *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;

  float mask = texture2D(uMaskTex, uv).r;

  vec2 velDir = normalize(uVelocity + vec2(1e-6));
  float speed = length(uVelocity);

  vec2 flow = vec2(
    fbm(uv * 3.0 + vec2(0.0, uTime * 0.07)) - 0.5,
    fbm(uv * 3.0 + vec2(uTime * 0.05, 0.0)) - 0.5
  );
  float flowMag = length(flow);

  float boundary = smoothstep(0.25, 0.75, mask) * (1.0 - smoothstep(0.75, 1.0, mask));
  float localWarp = (boundary + mask * 0.45) * uDistortionStrength;
  vec2 warp = flow * localWarp + velDir * speed * localWarp * 0.02;

  vec2 uvBottom = uv + warp;
  vec4 bottomSharp = texture2D(uBottomTex, uv);

  vec2 topUv = uv * uTopTextureScale;
  vec4 topTex = texture2D(uTopTex, topUv);

  float topNoise = flowMag;
  vec3 fogBase = vec3(0.906, 0.914, 0.871); // Updated to warm cream/beige
  vec3 fogLift = vec3(1.0) * (0.03 + topNoise * 0.06);
  float fogMix = uTopLayerOpacity * (1.0 - smoothstep(0.06, 0.62, mask));
  vec3 topLayer = mix(fogBase, topTex.rgb * 0.92 + fogLift, fogMix);

  float reveal = smoothstep(0.0, 0.34, mask);
  reveal = pow(reveal, 0.42);
  // Use sharp bottom sample in revealed regions so autonomous reveals do not look blurred.
  vec3 rgb = mix(topLayer, bottomSharp.rgb, reveal);
  // Cut fog aggressively where reveal is active so hidden layer reads clearly.
  float fogCut = smoothstep(0.03, 0.28, mask);
  rgb = mix(rgb, bottomSharp.rgb, fogCut);
  float clearCore = smoothstep(0.2, 0.72, mask);
  rgb = mix(rgb, bottomSharp.rgb, clearCore);
  // Keep a very faint mist path so reveals still feel atmospheric.
  float pathBand = smoothstep(0.1, 0.42, mask) * (1.0 - smoothstep(0.6, 0.92, mask));
  float pathNoise = flowMag * 0.8 + noise(uv * 5.2 + flow) * 0.2;
  float pathMist = pathBand * (0.012 + pathNoise * 0.01);
  rgb = mix(rgb, topLayer, pathMist);

  float edge = smoothstep(0.33, 0.58, mask) * (1.0 - smoothstep(0.58, 0.86, mask));
  vec3 edgeLight = vec3(0.98, 0.99, 0.95) * edge * uEdgeGlow * (1.0 - clearCore * 0.85);

  // Keep hidden layer crisp; no blur/tint mix over revealed interiors.
  rgb += edgeLight;

  gl_FragColor = vec4(rgb, 1.0);
}
