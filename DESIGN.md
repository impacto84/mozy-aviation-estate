# DESIGN — MOZY Private Aviation Estate (Flagship V3 · FORJA 1.1 · `--profile flagship`)

Documento de direção visual. Fonte de verdade dos valores: `src/styles/tokens.css`
(CSS) e `src/lib/motion/tokens.ts` (movimento em JS). Este arquivo explica **por quê**.

## 0. Direção travada: Cinematográfico & Ultra-Luxury Soberano

Território 5 de `skills/ui-craft/references/direcoes-estudio.md` (FORJA 1.1). A V2 foi
rejeitada por ler como landing B2B/SaaS (pílulas amarelas, paredes bege, capítulos em
abas, frames recomprimidos, fly-to removido, diagrama de aviação fora de escala, aviso de
cookies na dobra). A V3 inverte cada um desses pontos:

| Defeito da V2 | Decisão da V3 |
| :-- | :-- |
| Pílulas `999px` amarelas em toda seção | CTA arquitetônico: canto reto (`--radius-cta` = 2px), fio de latão de 1px, superfície lapidada escura; CTA primário só na dobra, no cabeçalho fixo (inclusive phone) e no convite final |
| Superfície `ivory` (bege) com tabelas | Superfície `dossier` = grafite quente `oklch(16%)`; todas as rotas ≥ 85% noturnas |
| 3 filmes em abas num bloco de 180svh, passo 4, `/_next/image q=60` | 3 atos independentes em tela cheia (420 / 520 / 460 svh), WebP original direto, passos 1 / 2 / 1 (phone 2 / 3 / 2) |
| Hero estático + shader `ogl` quase invisível | Ato I é a própria dobra: pôster `hero.jpg` q88 (LCP) + canvas da sequência `approach` em fusão com a rolagem |
| Atlas com cortes secos | Fly-to GPU: `transform-origin` no marcador, `scale(4.4)`, 1000 ms `cubic-bezier(0.22, 1, 0.36, 1)`, fusão no pouso |
| `RunwayDiagram` wireframe fora de escala | Envelope de pista em escala métrica real + pista inteira (3.000 m) + mapa hemisférico azimutal equidistante a partir de MCO |
| Aviso de cookies na dobra sem GTM | `MartechProvider hideBannerWithoutTracking`: sem `NEXT_PUBLIC_GTM_ID`, nada a consentir, nenhum aviso; preferências no rodapé |

## 1. Paleta (OKLCH)

Camada literal (nunca usada direto em componente) → camada semântica (`--color-*`).

| Literal | Valor | Papel |
| :-- | :-- | :-- |
| `--void-950` | `oklch(11.5% 0.012 262)` | Obsidiana: fundo padrão |
| `--navy-900` / `--navy-800` / `--navy-700` | `oklch(14.5%)` / `oklch(18%)` / `oklch(24%)` | Carvão: superfícies e bordas |
| `--graphite-900` / `--graphite-800` | `oklch(16% 0.01 75)` / `oklch(19.5% 0.012 75)` | Grafite de dossiê (tabelas, scorecards, console) |
| `--mist-100` / `--mist-400` | `oklch(94.5% 0.012 85)` / `oklch(73% 0.014 80)` | Texto e texto secundário (marfim sobre obsidiana, AA) |
| `--brass-200` … `--brass-800` | champanhe → latão escovado | Único acento: fios de 1px, rótulos mono, CTA |
| `--signal-400` | `oklch(70% 0.16 34)` | Risco / fora do alcance |

Semânticos novos: `--color-hairline` (latão 38%), `--color-hairline-strong`, `--color-champagne`.
Superfícies por `data-surface="void" | "navy" | "dossier"`; não existe superfície clara.
Contraste AA provado por teste (`glass-tokens.test.ts` refaz a conta sobre void e dossier).

## 2. Tipografia

- **Display**: Cormorant Garamond (300/400/500 + itálico) — títulos, números editoriais, legendas de filme.
- **Texto/UI**: Manrope Variable — corpo e formulário.
- **Mono tabular**: JetBrains Mono Variable — rótulos, coordenadas, envergaduras, contadores `QDR`, CTAs.
- `next/font/local` sobre os arquivos `@fontsource` (preload + fallback de métricas): CLS ≈ 0.

## 3. Forma e composição

- Raios: `--radius-cta` (2px) em todo controle; pílula só em marcadores circulares do mapa.
- Divisores: sempre `1px` em `--color-hairline`; marcas de enquadramento (cantos em latão) nos atos.
- Fotografia em sangria arquitetônica, `quality={88}`, com a legenda "Imagem: ilustração conceitual do projeto." nos renders.
- Ritmo da home: Ato I → tese → coleções (sangria alternada) → díptico Orlando → Ato II → filme noturno → casa + hangar → Ato III → console aeronáutico → Club → tecnologia → stage-gates → Atlas → capital → sponsor → convite final em filme.

## 4. Movimento

| Token | Valor | Uso |
| :-- | :-- | :-- |
| `--duration-fast` | 160 ms | hover, foco |
| `--duration-base` / `--duration-slow` | 320 / 720 ms | legendas por fase, fusões |
| `--duration-flyto` | 1000 ms | câmera do Atlas |
| `--ease-out` / `--ease-flyto` | `cubic-bezier(0.16, 1, 0.3, 1)` / `cubic-bezier(0.22, 1, 0.36, 1)` | entradas / fly-to |

Regras: um relógio (Lenis + ScrollTrigger no `gsap.ticker`); nada por quadro passa pelo React
(`--act-progress`, `data-phase` e o contador são escritos no DOM); canvas com DPR ≤ 2; o canvas
nunca é limpo antes de haver quadro decodificado (zero piscada); vídeos pausam fora da tela e com
a aba oculta e têm botão de pausa; com `prefers-reduced-motion: reduce` os atos viram quadro fixo
com as legendas abaixo, trilha compacta, nenhum quadro baixado, e o fly-to vira troca direta.

## 5. Componentes-assinatura

- **`CinematicAct`** (`src/components/chapter/`): trilha alta + palco sticky 100svh + pôster SSR + canvas 2D + legendas por fase + HUD (`ATO · barra · QDR`).
- **`FleetSimulator`** (`src/components/aviation/`): seletor das 6 aeronaves; `RunwayEnvelope` (1 m = 11 unidades, silhueta gerada da envergadura × comprimento públicos, outras 5 em contorno), `RunwayLength` (3.000 m em escala), `RangeMap` (azimutal equidistante, anel de alcance exato).
- **`SatelliteAtlas`**: fly-to contínuo da carta regional para satélite amplo / próximo / foto do anúncio, com retorno à carta.

## 6. Exceções registradas

- Literais de cor/medida existem **apenas** em `tokens.css`; `src/styles/design-tokens.test.ts` falha se algum `var(--…)` não estiver declarado.
- Propriedades escritas em tempo de execução (`--x`, `--y`, `--act-progress`, `--reveal-index`, `--marquee-duration`, `--glass-refraction-filter`) ficam numa lista explícita do teste, que confere a origem.
- Display: a Cormorant Garamond é servida de `src/app/fonts/` (WOFF2 gerado por
  `scripts/patch-display-accents.mjs`): os acentos dos minúsculos foram encurtados e assentados porque
  no subconjunto original flutuavam longe da letra nos títulos de ~100 px. Faces 300/400/400 itálico.
- Heróis no phone: o da home amplia a fotografia ancorada embaixo (o jato sobe para o céu, fora do
  texto); os das páginas internas ocupam a metade de cima e o texto fica abaixo, sobre obsidiana.
- Texto dentro dos SVG do console usa `font-size` em unidades do viewBox derivadas de `--text-base` e sobe no phone para continuar legível depois da redução.
