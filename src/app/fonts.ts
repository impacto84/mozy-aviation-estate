import localFont from "next/font/local";

/**
 * Fontes do site: os mesmos arquivos `@fontsource/*` (servidos pelo próprio site, sem
 * CDN), carregados por `next/font/local`. Assim cada face ganha preload no `<head>` e
 * uma fonte de fallback com métricas ajustadas (`size-adjust`, `ascent-override`…):
 * quando a fonte real chega, o texto não muda de tamanho e a página não pula (CLS).
 *
 * As variáveis `--nf-*` entram em `--font-display`, `--font-sans` e `--font-mono`
 * (`src/styles/tokens.css`). Subconjunto latin: cobre português e os símbolos do brief.
 *
 * Texto e UI (Manrope, JetBrains Mono) usam `display: "optional"`: com o preload a face
 * real chega antes da primeira pintura; se não chegar, o fallback fica até a próxima
 * navegação em vez de trocar no meio da leitura (a troca quebrava linhas diferente e
 * gerava CLS de 0,06–0,07 no gate). O display (Cormorant) segue em `swap`.
 * O carregador exige literais escritos por extenso (nada de template string ou constante).
 */

export const displayFont = localFont({
  src: [
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--nf-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "serif"],
});

export const sansFont = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--nf-sans",
  display: "optional",
  adjustFontFallback: "Arial",
  fallback: ["Avenir Next", "Segoe UI", "Helvetica", "sans-serif"],
});

export const monoFont = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--nf-mono",
  display: "optional",
  adjustFontFallback: "Arial",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

/** Classes que declaram as três variáveis no `<html>`. */
export const fontVariables = [displayFont.variable, sansFont.variable, monoFont.variable].join(" ");
