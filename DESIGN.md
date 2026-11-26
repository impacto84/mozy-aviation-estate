# DESIGN — MOZY Private Aviation Estate (Flagship V2 · FORJA 1.0)

Documento de direção visual. Fonte de verdade dos valores: `src/styles/tokens.css`
(CSS) e `src/lib/motion/tokens.ts` (movimento em JS). Este arquivo explica **por quê**.

## 1. Direções avaliadas

| # | Direção | Ideia | Por que ficou / saiu |
| :-- | :-- | :-- | :-- |
| A | **Gallery White / Swiss Real Estate** | Fundo claro, grotesca única, grade rígida, fotos em moldura. | Lê como loteamento premium genérico; apaga o crepúsculo e a pista iluminada, que são o ativo emocional do projeto. **Descartada.** |
| B | **Aviation HUD / Cockpit Tech** | Fundo preto, mono em tudo, verde de instrumento, linhas de HUD. | Forte para a página de aviação, mas fria e "gamer" para compradores UHNWI e family offices; o tom técnico competiria com a tese de capital. **Descartada** (aproveitada só como acento: leituras em mono). |
| C | **High-Altitude Architectural Luxury / Sovereign Aviation Club** | Noite de crepúsculo (void/navy) alternada com papel de dossiê (ivory), serifa display editorial, latão como única cor de acento, dados em mono tabular. | Une o tom de clube privado (residência) com o rigor de dossiê de investimento (tabelas, scorecard, stage-gates). **Escolhida.** |

## 2. Paleta (OKLCH)

Camada literal (nunca usada direto em componente) → camada semântica (`--color-*`).

| Literal | Valor | Papel |
| :-- | :-- | :-- |
| `--void-950` | `oklch(13.5% 0.018 255)` | Fundo padrão (noite) |
| `--navy-900` / `--navy-800` / `--navy-700` | `oklch(19.5% 0.034 252)` / `oklch(23.5% 0.04 252)` / `oklch(29% 0.042 252)` | Superfícies e bordas no escuro |
| `--mist-100` / `--mist-400` | `oklch(94% 0.008 245)` / `oklch(72% 0.022 245)` | Texto e texto secundário no escuro |
| `--ivory-100` / `--ivory-50` | `oklch(95% 0.012 85)` / `oklch(97.5% 0.008 85)` | Papel de dossiê (superfície clara) |
| `--ink-900` / `--stone-600` | `oklch(19% 0.03 252)` / `oklch(43% 0.022 250)` | Texto no claro |
| `--brass-300` / `--brass-700` | `oklch(83% 0.1 80)` / `oklch(47% 0.09 68)` | Acento (latão) no escuro / no claro |
| `--signal-400` | `oklch(68% 0.19 32)` | Alerta / risco |
| `--runway-green` | `oklch(74% 0.14 150)` | Sucesso / luz de pista |

**Superfícies por seção**: `data-surface="void" | "navy" | "ivory"` reescreve os tokens
semânticos e o `color-scheme`. O ritmo da home alterna noite → dossiê → noite.
Contraste AA verificado por teste (`glass-tokens.test.ts` refaz a conta do vidro sobre
o pior fundo nas superfícies void e ivory).

## 3. Tipografia (dupla `@fontsource`, servida localmente)

- **Display**: Cormorant Garamond (300/400/500 + itálico 400) — títulos, números editoriais, citações.
- **Texto/UI**: Manrope Variable — corpo, botões, formulário.
- **Acento técnico**: JetBrains Mono Variable — kickers, índices, leituras de HUD, tabelas (`tabular-nums`).
- Escala fluida `--text-2xs` … `--text-display` com `clamp()`; nunca `system-ui`/Arial em display.
- Carregamento: `next/font/local` sobre os arquivos `@fontsource` (`src/app/fonts.ts`), com preload
  e fallback de métricas ajustadas; texto/UI em `display: optional` (sem troca no meio da leitura,
  CLS ≈ 0), display em `swap`. Os tokens `--font-*` leem as variáveis `--nf-*`.

## 4. Espaço, forma e camadas

- Espaço base 4 px (`--space-0-5` … `--space-32`) + `--space-section` fluido.
- Layout: `--container-max: 82rem`, `--container-wide: 96rem`, medida de leitura `60ch`.
- `--column-kpi: calc(var(--text-2xl) * 2.5)`: coluna de número grande que acompanha a
  fonte (pesos do scorecard em `/terrenos`), para o número nunca invadir o texto.
- `--consent-offset`: respiro inferior fixo dos heróis do tamanho do aviso de cookies
  (7,5rem no phone, 4,5rem no tablet, 0 no desktop). Fixo de propósito: ligar/desligar com o
  aviso (que só aparece após a hidratação) deslocava o conteúdo e estourava o CLS.
- Raios discretos (`--radius-sm` a `--radius-xl`), alvos de toque ≥ `--target-min` (44 px).

## 5. Movimento

| Token | Valor | Uso |
| :-- | :-- | :-- |
| `--duration-fast` | 160 ms | hover, foco, abas |
| `--duration-base` | 320 ms | entrada do canvas, painéis |
| `--duration-slow` | 720 ms | legendas do capítulo, reveals |
| `--duration-cinematic` | 1200 ms | transições de cena |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | padrão de entrada |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | cenas e scrub |

Regras: toda transição/animação vive dentro de `@media (prefers-reduced-motion: no-preference)`;
um único relógio `rAF` (Lenis + ScrollTrigger + palco WebGL); nada por frame passa pelo React;
palco WebGL e vídeo pausam fora da tela e com a aba oculta. Com movimento reduzido, o capítulo
cinematográfico vira quadro estático nítido com todas as legendas visíveis.

## 6. Componentes-assinatura

- **Hero híbrido**: pôster LCP no servidor + luz de pista em WebGL2 (`ogl`) carregada depois da pintura, com fallback e tratamento de perda de contexto.
- **Capítulo scrollytelling**: três sequências reais de frames (aproximação, residência, hangar), trilho de 180svh com palco sticky.
- **Vidro** (`GlassPanel`): `backdrop-filter` só dentro de `@supports`, fallback opaco AA.
- **Simulador de frota/pista** (`/aviacao`), **Atlas satelital** (`/terrenos`), **Data Room** (`/solicitar-acesso`).

## 7. Exceções registradas

- Literais de cor/medida existem **apenas** em `tokens.css`; o teste `src/styles/design-tokens.test.ts`
  falha se qualquer `var(--…)` usado em `src/**/*.css` não estiver declarado.
- Propriedades escritas em tempo de execução (`--x`, `--y`, `--share`, `--scrub-progress`,
  `--reveal-index`, `--marquee-duration`, `--glass-refraction-filter`) e contratos entre
  módulos (`--glass-text-muted`, `--hero-color-*`) ficam numa lista explícita do teste, que
  confere se a origem realmente as escreve.
