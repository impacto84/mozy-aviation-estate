import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as rotas.
 * A CSP só entra no build de produção: o servidor de desenvolvimento do Next
 * precisa de `eval` para o Fast Refresh.
 */
const GTM_ORIGIN = "https://www.googletagmanager.com";
const GA_ORIGINS = "https://*.google-analytics.com https://*.analytics.google.com";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${GTM_ORIGIN}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${GTM_ORIGIN} ${GA_ORIGINS}`,
  "font-src 'self'",
  `connect-src 'self' ${GTM_ORIGIN} ${GA_ORIGINS}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const BASE_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
] as const;

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /*
   * O typecheck roda como etapa própria e obrigatória (`npm run typecheck`, primeira
   * etapa de `scripts/verify.sh`), antes do build. Repeti-lo dentro do `next build`
   * estourava o limite de memória do contêiner de CI (4 GB).
   */
  typescript: { ignoreBuildErrors: true },
  experimental: { cpus: 2 },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1440, 1920, 2560],
    imageSizes: [96, 160, 256, 384],
    qualities: [72, 80, 88],
    minimumCacheTTL: 2_678_400,
  },
  async headers() {
    const headers = isProduction
      ? [...BASE_HEADERS, { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }]
      : [...BASE_HEADERS];
    return [
      { source: "/:path*", headers },
      {
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2678400, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
