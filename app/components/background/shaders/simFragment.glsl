uniform sampler2D uPrevMask;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform vec2 uResolution;
uniform float uTime;
uniform float uDelta;
uniform float uDecay;
uniform float uBrushRadius;
uniform float uSoftness;
uniform float uNoiseAmount;
uniform float uAdvection;
uniform float uVelocityStretch;
uniform float uVelocityGain;
uniform float uActive;
uniform vec2 uAutoPointer;
uniform vec2 uAutoVelocity;
uniform float uAutoActive;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amp;
    p = rot * p * 2.03 + 7.13;
    amp *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 texel = 1.0 / max(uResolution, vec2(1.0));

  vec2 v = uVelocity * uVelocityGain;
  vec2 velDir = normalize(v + vec2(1e-6));
  float speed = length(v);

  vec2 flow = vec2(
    fbm(uv * 4.0 + vec2(uTime * 0.11, -uTime * 0.09)) - 0.5,
    fbm(uv * 4.0 + vec2(-uTime * 0.08, uTime * 0.13)) - 0.5
  );

  vec2 advection = velDir * speed * uAdvection * texel * 18.0;
  vec2 sampleUv = uv - advection - flow * uAdvection * texel * 8.0;
  float history = texture2D(uPrevMask, sampleUv).r;

  float blur = 0.0;
  blur += texture2D(uPrevMask, sampleUv + vec2(texel.x, 0.0)).r;
  blur += texture2D(uPrevMask, sampleUv - vec2(texel.x, 0.0)).r;
  blur += texture2D(uPrevMask, sampleUv + vec2(0.0, texel.y)).r;
  blur += texture2D(uPrevMask, sampleUv - vec2(0.0, texel.y)).r;
  float autoInfluence = clamp(uAutoActive, 0.0, 1.0);
  float blurMix = mix(0.15, 0.03, autoInfluence);
  history = mix(history, blur * 0.25, blurMix);

  float decay = pow(uDecay, max(uDelta * 60.0, 0.0));
  history *= decay;

  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 pUv = uv * aspect;
  vec2 pMouse = uPointer * aspect;

  vec2 toPx = pUv - pMouse;
  vec2 side = vec2(-velDir.y, velDir.x);
  float along = dot(toPx, velDir);
  float across = dot(toPx, side);
  // Keep cursor and autonomous reveals at the same reduced visual size.
  float sharedRadius = max(uBrushRadius - (45.0 / max(uResolution.y, 1.0)), 0.01);

  float stretch = 1.0 + min(speed * uVelocityStretch, 2.5);
  float eDist = sqrt((along / stretch) * (along / stretch) + across * across);

  float edgeNoise = (fbm(uv * 10.0 + flow * 2.0 + uTime * 0.35) - 0.5) * uNoiseAmount;
  float brush = 1.0 - smoothstep(
    sharedRadius - uSoftness,
    sharedRadius + uSoftness,
    eDist - edgeNoise
  );
  float force = brush * mix(0.55, 1.0, min(speed * 0.25, 1.0)) * uActive;

  // Autonomous reveal follows the exact same brush logic as cursor reveal.
  vec2 aV = uAutoVelocity * uVelocityGain;
  vec2 aDir = normalize(aV + vec2(1e-6));
  float aSpeed = length(aV);
  vec2 aMouse = uAutoPointer * aspect;
  vec2 aTo = pUv - aMouse;
  vec2 aSide = vec2(-aDir.y, aDir.x);
  float aAlong = dot(aTo, aDir);
  float aAcross = dot(aTo, aSide);
  float autoRadius = sharedRadius;
  float aStretch = 1.0 + min(max(aSpeed, 0.24) * uVelocityStretch, 2.7);
  float aDist = sqrt((aAlong / aStretch) * (aAlong / aStretch) + aAcross * aAcross);
  float autoSoftness = uSoftness * 0.66;
  float aBrush = 1.0 - smoothstep(
    autoRadius - autoSoftness,
    autoRadius + autoSoftness,
    aDist - edgeNoise * 0.45
  );
  // Ensure solid center for autonomous path reveals.
  float aCore = 1.0 - smoothstep(0.0, autoRadius * 0.82, aDist);
  aBrush = max(aBrush, aCore);
  // Keep autonomous reveals fully readable during travel and linger.
  float autoForce = aBrush * uAutoActive * 1.45;
  // Guarantee a clear autonomous center so hidden layer does not look misty.
  autoForce = max(autoForce, aCore * autoInfluence * 1.1);

  float value = max(history, max(force, autoForce));
  value = clamp(value, 0.0, 1.0);

  gl_FragColor = vec4(value, value, value, 1.0);
}
