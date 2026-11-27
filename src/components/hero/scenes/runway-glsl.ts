/**
 * GLSL ES 3.00 do hero MOZY: "crepúsculo de pista iluminada". Escrito do zero
 * para este projeto. É uma camada TRANSPARENTE sobre a fotografia do pôster
 * (`/media/estate-dusk.jpg`): luzes de borda da pista com sequência de
 * aproximação ("rabbit"), brilho do sol no horizonte, faixa anamórfica fina e
 * névoa lenta no céu. Saída em alfa pré-multiplicado.
 *
 * As posições usam coordenadas da IMAGEM (0..1, y para baixo), convertidas para
 * a tela com a mesma conta do `object-fit: cover`, para a luz cair sobre a pista
 * em qualquer proporção de tela.
 *
 * Custo por pixel: 1 campo de ruído (2 oitavas) + 16 luzes (distância + exp).
 */

export const RUNWAY_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const RUNWAY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform float uImageAspect;
uniform vec3 uColorAccent;
uniform vec3 uColorInk;

const int LIGHT_COUNT = 16;
// Borda direita da pista na fotografia (coordenadas da imagem, y para baixo).
const vec2 EDGE_NEAR = vec2(0.813, 1.02);
const vec2 EDGE_FAR = vec2(0.924, 0.25);
const vec2 SUN = vec2(0.905, 0.165);
const float HORIZON = 0.205;
const float RABBIT_PERIOD = 2.6;
// Igual ao object-position do pôster (68% 50%): o recorte horizontal favorece a pista.
const float FOCUS_X = 0.68;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Tela (vUv, y para cima) -> imagem (y para baixo), igual ao object-fit: cover.
vec2 screenToImage(vec2 screen) {
  float screenAspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 image = screen;
  if (screenAspect > uImageAspect) {
    image.y = 0.5 + (screen.y - 0.5) * (uImageAspect / screenAspect);
  } else {
    float visible = screenAspect / uImageAspect;
    image.x = (1.0 - visible) * FOCUS_X + screen.x * visible;
  }
  return vec2(image.x, 1.0 - image.y);
}

// Imagem -> pixels da tela, para medir distância em pixels (luz redonda).
vec2 imageToPixels(vec2 image) {
  float screenAspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 screen = vec2(image.x, 1.0 - image.y);
  if (screenAspect > uImageAspect) {
    screen.y = 0.5 + (screen.y - 0.5) * (screenAspect / uImageAspect);
  } else {
    float visible = screenAspect / uImageAspect;
    screen.x = (image.x - (1.0 - visible) * FOCUS_X) / visible;
  }
  return screen * uResolution;
}

void main() {
  vec2 pixel = vUv * uResolution;
  vec2 image = screenToImage(vUv);
  float scale = uResolution.y / 900.0;

  vec3 light = vec3(0.0);
  float alpha = 0.0;

  // 1. Sol no horizonte: respira devagar.
  vec2 sunPixel = imageToPixels(SUN);
  float sunDistance = length(pixel - sunPixel) / (uResolution.y * 0.42);
  float breath = 0.9 + 0.1 * sin(uTime * 0.35);
  float sunGlow = exp(-sunDistance * sunDistance * 3.2) * 0.55 * breath;
  light += uColorAccent * sunGlow;
  alpha += sunGlow * 0.6;

  // 2. Faixa anamórfica fina na linha do horizonte.
  float horizonPixel = imageToPixels(vec2(0.5, HORIZON)).y;
  float band = exp(-pow((pixel.y - horizonPixel) / (6.0 * scale), 2.0));
  float bandReach = smoothstep(0.0, 1.0, 1.0 - abs(image.x - SUN.x) * 1.6);
  float streak = band * bandReach * 0.32 * breath;
  light += mix(uColorAccent, uColorInk, 0.35) * streak;
  alpha += streak * 0.5;

  // 3. Névoa lenta no céu (acima do horizonte), quase imperceptível.
  float sky = smoothstep(HORIZON + 0.02, 0.0, image.y);
  float haze = valueNoise(image * vec2(3.0, 9.0) + vec2(uTime * 0.025, 0.0));
  haze = haze * 0.6 + valueNoise(image * vec2(7.0, 17.0) - vec2(uTime * 0.04, 0.0)) * 0.4;
  float hazeAmount = sky * smoothstep(0.45, 0.85, haze) * 0.12;
  light += uColorInk * hazeAmount;
  alpha += hazeAmount * 0.4;

  // 4. Luzes de borda da pista com sequência de aproximação (do longe para o perto).
  float phase = fract(uTime / RABBIT_PERIOD);
  for (int i = 0; i < LIGHT_COUNT; i++) {
    float t = float(i) / float(LIGHT_COUNT - 1);
    float along = pow(t, 1.7);
    vec2 lightImage = mix(EDGE_FAR, EDGE_NEAR, along);
    vec2 lightPixel = imageToPixels(lightImage);
    float radius = mix(1.6, 6.5, along) * scale;
    float d = length(pixel - lightPixel) / radius;
    float core = exp(-d * d);
    float halo = exp(-d * 0.55) * 0.18;
    float pulse = exp(-pow((phase - t) * 9.0, 2.0)) * 1.6;
    float flicker = 0.85 + 0.15 * sin(uTime * 3.0 + float(i) * 1.7);
    float intensity = (core + halo) * (0.55 * flicker + pulse);
    light += mix(uColorAccent, uColorInk, 0.55) * intensity;
    alpha += intensity * 0.8;
  }

  // Grão leve para não aparecer banding no degradê.
  float grain = (hash21(pixel + floor(uTime * 24.0)) - 0.5) * 0.012;
  alpha = clamp(alpha + grain, 0.0, 0.92);
  vec3 color = clamp(light, 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
`;
