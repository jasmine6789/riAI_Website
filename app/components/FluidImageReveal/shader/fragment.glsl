uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform float uRevealRadius;
uniform float uNoiseIntensity;
uniform float uDistortionStrength;
uniform float uGlowIntensity;
uniform float uChromaStrength;
uniform float uVelocity;

varying vec2 vUv;

/* --- Hash / value noise / FBM (compact) --- */
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
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.05 + 17.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);

  vec2 uvA = uv * aspect;
  vec2 mouseA = uMouse * aspect;

  float t = uTime;
  vec2 flow = vec2(fbm(uv * 2.8 + t * 0.12), fbm(uv * 2.8 - t * 0.09));
  vec2 flow2 = vec2(fbm(uv * 5.5 - t * 0.07), fbm(uv * 5.5 + t * 0.11));

  float velBoost = 1.0 + uVelocity * 1.35;
  float radius = uRevealRadius * velBoost * length(aspect);

  float d = length(uvA - mouseA);

  float n =
    (fbm(uv * 4.0 + flow + t * 0.15) - 0.5) * uNoiseIntensity +
    (fbm(uv * 9.0 - flow2 * 0.5 + t * 0.22) - 0.5) * uNoiseIntensity * 0.55;

  float organic = d - n * radius * 2.2;

  float inner = radius * 0.72;
  float outer = radius * 1.28;
  float mask = 1.0 - smoothstep(inner, outer, organic);

  vec2 warp =
    (flow - 0.5) * uDistortionStrength * mask +
    (flow2 - 0.5) * uDistortionStrength * 0.6 * mask;

  vec2 uv1 = uv + warp;
  vec2 uv2 = uv + warp * 1.35;

  float ab = uChromaStrength * mask * 0.004;
  vec4 base = texture2D(uTexture1, uv1);
  vec4 hid = texture2D(uTexture2, uv2);
  vec4 hidR = texture2D(uTexture2, uv2 + vec2(ab, 0.0));
  vec4 hidB = texture2D(uTexture2, uv2 - vec2(ab, 0.0));
  vec4 hidCA = vec4(hidR.r, hid.g, hidB.b, hid.a);
  vec4 revealCol = mix(hid, hidCA, mask * 0.75);

  float edgeBand =
    smoothstep(0.2, 0.55, mask) * (1.0 - smoothstep(0.55, 1.0, mask));
  vec3 glow = vec3(0.35, 0.62, 1.0) * edgeBand * uGlowIntensity;

  vec3 rgb = mix(base.rgb, revealCol.rgb, mask) + glow;

  gl_FragColor = vec4(rgb, 1.0);
}
