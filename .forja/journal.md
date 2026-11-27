# Journal FORJA — MOZY Private Aviation Estate (feat/forja-flagship-v2)

Registro de decisões do build flagship (RFC-0001 · ADR-0001). Mais recente embaixo.

## 2026-11-26 — Spec e direção
- RFC-0001, ADR-0001 e `.forja/brief.md` congelados (commit `6e561f5`).
- Três direções avaliadas (detalhe em `DESIGN.md` §1): A *Gallery White*, B *Aviation HUD*,
  C *High-Altitude Architectural Luxury*. **Escolhida: C.** Motivo: único caminho que serve ao
  mesmo tempo o comprador UHNWI (clube, crepúsculo) e o LP/family office (dossiê, tabelas).
- Paleta OKLCH void/navy/ivory + latão; dupla Cormorant Garamond + Manrope, acento JetBrains Mono,
  todas via `@fontsource` local.

## 2026-11-26 — Migração e construção
- Template TanStack/Vite/PGlite/BetterAuth removido; Next.js 16 App Router + React 19, TS `strict`.
- Cinco rotas reais + `POST /api/leads` (Zod na borda, RFC 7807 com `traceId`, honeypot,
  rate limit, mesma origem). Consent Mode v2 negado por padrão; UTM/click-ids preservados até o envio.
- Hero WebGL2 com `ogl` em chunk lazy; capítulo de frames com scrub no relógio único.
- O original encadeava 1.800vh de scrollymation antes do conteúdo; agora há um capítulo único
  com três sequências escolhidas por aba.

## 2026-11-26 — Reta final (90% → 100%)
- **OOM**: o passe anterior morreu com `vitest` sem limite de workers (cgroup de 4 GiB). Fixado
  `pool: "forks"`, `maxWorkers: 1`, `fileParallelism: false` e `NODE_OPTIONS=--max-old-space-size=1536`
  em `typecheck`, `build` e `test`. `next build` já roda com `typescript.ignoreBuildErrors`
  porque o typecheck é etapa própria e anterior em `scripts/verify.sh`.
- **Testes desalinhados do contrato**: `LeadForm.test.tsx`, `lead.test.ts` e `lead-handler.test.ts`
  ainda descreviam o formulário de demonstração da fixture (sem perfil, redirect `/obrigado`,
  corpo `{ error }`). Reescritos para o Data Room real: perfil obrigatório, confirmação na página,
  erros RFC 7807 com `traceId`, log estruturado sem PII. `glass-tokens.test.ts` passou a ler as
  superfícies void/ivory (o arquivo de tokens não usa `light-dark()`).
- **Scorecard `/terrenos`**: a coluna dos pesos (25%…10%) era estreita para `--text-2xl` e o número
  invadia "Espaço aéreo + runway fit". Nova `--column-kpi` proporcional à fonte.
- **Listas em régua** (`/tese-capital`, home): título e descrição eram `<span>` inline e saíam colados
  ("PerímetroCâmeras 4K…"). Agora empilhados em grade com respiro.
- **Teste de integridade de tokens** (`src/styles/design-tokens.test.ts`): encontrou `--space-px`
  inexistente na home (corrigido para `--border-width`).
- **Capítulo da home**: trilho reduzido de 320svh para 180svh (a faixa escura abaixo do palco sticky
  nas capturas full-page caiu de ~2.000 px para ~700 px; o scrub de 121 quadros segue em ~6 px/quadro).
  A legenda de abertura do capítulo 1 repetia o `<h1>` do hero; agora abre com "3.000 m de pista para
  grandes jatos." (fato do brief). Movimento reduzido segue com quadro estático.
- **Mobile 390×844**: o aviso de cookies cobria o CTA primário. `--consent-offset` dá aos heróis um
  respiro inferior fixo do tamanho do aviso. A 1ª versão ligava a reserva só com o aviso aberto
  (`:has()`), mas o aviso entra após a hidratação e o conteúdo pulava 120 px: CLS 0,10–0,12 no gate
  completo. Reserva fixa → sem deslocamento.
- **Gate completo, rodada 1**: `RESP-CONTENT-COLLAPSE` no tablet porque as legendas inativas do
  capítulo ficavam empilhadas com `opacity: 0` (o detector olha `visibility`). Inativas agora também
  saem com `visibility: hidden`.
- **Gate completo, rodada 1 — PERF-CLS (9 falhas, 0,056–0,116)**: duas causas medidas com
  `PerformanceObserver` sob CPU 4x + rede lenta. (1) a reserva do aviso de cookies ligada por `:has()`
  (corrigido acima); (2) troca de fonte: `@fontsource` via CSS com `font-display: swap` e sem fallback
  de métricas — a Manrope real quebra linha diferente do fallback e os blocos pulavam 30–60 px.
  Fontes migradas para `next/font/local` sobre os mesmos arquivos `@fontsource` (preload + fallback
  com métricas ajustadas); Manrope e JetBrains Mono em `display: "optional"`, Cormorant em `swap`.
  CLS medido depois: ≤ 0,0012 nas 5 rotas × 3 larguras.
- **A11Y**: a marca do cabeçalho não tem mais `aria-label` divergente do texto visível
  (`label-content-name-mismatch`); o nome acessível é o próprio texto + "página inicial" oculto.

## 2026-11-26 — Júri cego, rodada 1: FIX (6,9)
Correções aplicadas (P1 e P2 do júri):
- **CTA**: o dourado cheio passou a ser sempre "Solicitar acesso ao Data Room confidencial"; simulador
  (/aviacao) e atlas (/terrenos e home) viraram contorno. Botão do formulário usa o mesmo rótulo.
- **Hero phone**: a foto paisagem cobria a tela inteira e ampliava só o céu (desfocado). No phone a
  foto ocupa a metade de cima, recortada no jato e na pista, e se dissolve no fundo; heróis internos
  com `sizes` coerente com o recorte.
- **Prova**: removido o superlativo sem fonte "o endereço mais cobiçado da região de Orlando" (vinha
  da V05). Heróis com render ganham a legenda "Imagem: ilustração conceitual do projeto."
- **/terrenos**: o subtítulo descrevia um mapa de satélite que não estava no hero; agora descreve os três
  candidatos e os critérios (fatos do brief). O satélite com marcadores segue no Atlas.
- **Números**: valores sem quebra (`nowrap`), alinhados pelo topo (`column-reverse` + `flex-end`),
  fatos 2×2 até 1200 px; HUD da home em `--text-xl` com rótulos visíveis acima do aviso de cookies.
- **Acabamento**: "Mozy" → "MOZY"; título e linha do sponsor com respiro; bloco "Contato direto"
  duplicado removido de /solicitar-acesso (fica no rodapé).

## Exceções e limites conhecidos
- Capturas full-page do Chromium acima de ~8.192 px de altura repetem o topo da página (limite de
  textura da captura, não do layout). A home tem ~15k px; a repetição nas capturas não existe no navegador.
- Sem verificação em Safari/Firefox reais nem disparo ao vivo de GTM/pixels (sem IDs de produção).

## 2026-11-27 — V3 Cinematográfica (FORJA 1.1 · `--profile flagship`)
Rejeição da V2 (atos em abas, frames decimados via `/_next/image q=60`, hero estático com shader
quase invisível, Atlas sem fly-to, diagrama de aviação fora de escala, estética B2B bege/pílulas,
aviso de cookies na dobra) atacada ponto a ponto:
- **Atos**: `CinematicAct` + `useFrameScrub` + `frame-loader` com WebP original direto; approach 121
  (passo 1/2) na própria dobra, villa 722 (passo 2/3 = 361 quadros), hangar 361 (passo 1/2); trilhas
  420/520/460 svh (phone 400/480/440); janela deslizante de `ImageBitmap`, canvas nunca limpo,
  DPR ≤ 2, decodificação na largura que o `cover` exige (no phone a altura manda).
- **Filmes**: `night.mp4` e `closer.mp4` em bandas próprias com pôster, pausa fora da tela e controle.
- **Aviação**: especificações públicas das 6 aeronaves (brief), silhueta métrica sobre 45 m, pista
  inteira (decolagem × 3.000 m) e mapa azimutal equidistante a partir de MCO com 7 polos.
- **Atlas**: fly-to GPU `scale(4.4)` em `ox/oy`, 1000 ms `cubic-bezier(0.22, 1, 0.36, 1)`, na home e em /terrenos.
- **Direção**: tokens obsidiana/carvão/grafite, fios de latão, CTA de canto reto; sem superfícies claras.
- **Consentimento**: `hideBannerWithoutTracking`; sem GTM o `generate_lead` vai para a `dataLayer`
  local na hora (destino `first-party`), com GTM volta a esperar o consentimento.
- **SecOps (lesson #24)**: `readBody` por stream com teto, origem canônica, `x-real-ip`/último salto,
  webhook `redirect: "error"`, evicção do limitador.
- **Fontes**: os acentos da Cormorant (subconjunto `@fontsource`) flutuavam nos títulos; 
  `scripts/patch-display-accents.mjs` gera WOFF2 com os acentos assentados (OFL 1.1, 3 faces, 88 kB).

### Gate e júri
- Gate flagship: rodadas 1–14. Falhas encontradas e corrigidas: CODE-NO-WINDOW-RENDER (anotação de
  retorno em seta), PERF-CLS 0,087 (troca tardia da Cormorant → `optional`), TRACK-FORM-EVENT (fila do
  tracker sem banner), LEGAL-ANCHORS (índice da obra), PERF-LCP /terrenos (WOFF1 pesado; fonte do hero).
- Júri cego (novo a cada rodada, sem veredito anterior): 7,4 → 7,6 → 7,9 → 8,1 → 7,9 → 8,1 → 8,1 →
  8,1 → 8,4 (cabeçalho "FIX" contraditório com o json "SHIP"; rodada repetida) → **SHIP 8,4 (rodada 10)**,
  zero P0/P1. Vereditos em `.forja/verdicts/jury-v3-*.json`.
- P2 restantes da rodada 10 (não bloqueiam): HUD do Ato III acompanhando a seção seguinte no desktop,
  véu na entrada do Ato III no phone, jato sob o título da tese no tablet, ritmo de /tese-capital,
  etiquetas do master plan no tablet.
