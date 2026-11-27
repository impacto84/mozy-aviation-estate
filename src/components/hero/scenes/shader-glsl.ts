/**
 * GLSL ES 3.00 do hero de faixas esculturais. Escrito do zero para o FORJA:
 * dobras inclinadas com relevo volumétrico, campo de ruído lento e especular
 * quente concentrado no lado oposto ao texto, com grão cinematográfico.
 *
 * Custo por pixel: 6 leituras de ruído de valor (2 campos de 3 oitavas) + 2 hashes.
 * Sem laço, sem textura, sem derivada: cabe em GPU integrada com DPR 2.
 */

export const SHADER_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const SHADER_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform float uProgress;
uniform vec2 uResolution;
uniform float uSideLayout;
uniform vec3 uColorBase;
uniform vec3 uColorSoft;
uniform vec3 uColorAccent;
uniform float uBandCount;
uniform float uFlow;
uniform float uGrain;

const float GRAIN_FRAMES_PER_SECOND = 24.0;

uint mixBits(uint value) {
  value ^= value >> 16;
  value *= 2654435761u;
  value ^= value >> 13;
  value *= 2246822519u;
  value ^= value >> 16;
  return value;
}

// Número pseudoaleatório 0..1 por célula inteira. Aritmética inteira: igual em qualquer GPU.
float hash21(vec2 cell) {
  ivec2 lattice = ivec2(floor(cell));
  uint mixed = mixBits(uint(lattice.x) + mixBits(uint(lattice.y)));
  return float(mixed) / 4294967295.0;
}

float valueNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 fade = local * local * (3.0 - 2.0 * local);
  float bottom = mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), fade.x);
  float top = mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0, 1.0)), fade.x);
  return mix(bottom, top, fade.y);
}

// Três oitavas bastam para um campo lento; mais que isso é custo sem ganho visível.
float drift(vec2 point) {
  return 0.6 * valueNoise(point) + 0.3 * valueNoise(point * 2.1 + 7.3) + 0.1 * valueNoise(point * 4.3 + 19.1);
}

vec3 encodeSrgb(vec3 linear) {
  vec3 low = linear * 12.92;
  vec3 high = 1.055 * pow(max(linear, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), linear));
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 point = vec2(vUv.x * aspect, vUv.y);
  float time = uTime * uFlow;

  // Onde a escultura se concentra: à direita no desktop, embaixo no empilhado.
  // A área de texto preserva a cor base sólida, garantindo contraste alto em qualquer frame.
  float axis = mix(1.0 - vUv.y, vUv.x, uSideLayout);
  float edge = 0.16 * (drift(point * 1.25 + vec2(0.0, time * 0.35)) - 0.5);
  float energy = smoothstep(mix(0.52, 0.42, uSideLayout), mix(0.96, 0.88, uSideLayout), axis + edge);

  // Dobras inclinadas com curvatura dupla e resposta sutil ao progresso de rolagem.
  float field = drift(point * 0.72 + vec2(time * 0.22, -time * 0.14));
  float wave = sin(point.y * 2.2 - time * 0.4 + field * 3.14) * 0.18;
  float coordinate = (point.x * 0.84 + point.y * 0.54) * uBandCount + field * 2.35 + wave + time * 0.55 + uProgress * 1.6;
  float band = fract(coordinate);
  float bandIndex = floor(coordinate);

  // Perfil volumétrico da dobra: sombra profunda na dobra, corpo quente e crista luminosa.
  float lift = hash21(vec2(bandIndex, 17.0));
  float profile = sin(band * 3.14159265);
  float depth = smoothstep(0.0, 0.88, band);
  float ramp = clamp(depth * 0.72 + lift * 0.32 + (0.55 - vUv.y) * 0.24, 0.0, 1.0);

  vec3 shadowTone = mix(uColorAccent, uColorAccent * 0.58, 0.45);
  vec3 ribbon = mix(uColorSoft, uColorAccent, ramp * ramp);
  ribbon = mix(ribbon, shadowTone, smoothstep(0.78, 1.0, band) * 0.42);

  // Brilho especular na crista da dobra para sensação tátil de tecido/cerâmica.
  float rim = smoothstep(0.04, 0.16, band) * (1.0 - smoothstep(0.16, 0.42, band));
  ribbon = mix(ribbon, uColorBase, 0.38 * rim + 0.08 * profile);

  vec3 color = mix(uColorBase, ribbon, energy);

  // Grão em passos de 1/24 s: quebra o banding do gradiente sem piscar.
  float grainFrame = floor(uTime * GRAIN_FRAMES_PER_SECOND);
  float grain = hash21(gl_FragCoord.xy + grainFrame * vec2(37.0, 91.0)) - 0.5;
  fragColor = vec4(encodeSrgb(color) + grain * uGrain, 1.0);
}
`;
