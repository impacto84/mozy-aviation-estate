# RFC-0001: Reconstrução Flagship 4x+ — MOZY Private Aviation Estate (FORJA 1.0)

- **Status**: `Aprovada para Execução Autônoma`
- **Autor(a)**: `MAESTRO (Antigravity)`
- **Construtor Principal**: `bot:forja (Claude Max, FORJA 1.0)`
- **Auditores**: `guardian` + `jury` (FORJA) · `bot:secops-auditor` (`Four-Eyes`, Grok)
- **Data**: `2026-11-26`
- **Branch / Worktree**: `feat/forja-flagship-v2` (`forja-flagship-v2`)

---

## 1. Diagnóstico do Estado Atual (GitHub `main`)

Inspecionando o repositório original (`impacto84/mozy-aviation-estate`, `HEAD 43e238b`):
1. **Arquitetura Desalinhada & Bloat**: empacotado sobre um template TanStack Start + Vite + `PGlite` + `BetterAuth` + módulo `multiplayer/p2p.ts` + scripts de PWA/bridge que não atendem a uma apresentação institucional/investidores de altíssimo padrão.
2. **Primeira Dobra & Peso Excessivo**: encadeia três `Scrollymation` sequenciais somando **`1.800vh`** (`approach` 121 frames + `villa` 722 frames + `hangar` 361 frames = `1.204` WebPs) antes do conteúdo estruturado, bloqueando escaneabilidade executiva e elevando risco de abandono em mobile (`390px`) e `prefers-reduced-motion`.
3. **Visual Repetitivo de Template**: quase toda seção repete o mesmo padrão (etiqueta `uppercase` dourada acima do título + grade uniforme de cards com borda `#2a3441`), mantendo apenas rotas âncora na `/` sem profundidade interativa dedicada.
4. **Incompatibilidade com o Piso FORJA 1.0**:
   - `.reveal` em `src/styles.css` inicia com `opacity: 0` e depende de `IntersectionObserver` — violando visibilidade imediata e segurança contra falhas em `prefers-reduced-motion` (`MOTION-REDUCED`).
   - Ausência de Consent Mode v2 (`TRACK-CONSENT-FIRST`), preservação ponta a ponta de `utm_*`/click-ids (`TRACK-UTM-FORM`), formulário qualificado de Data Room com estados completos + API validada na borda com erros `RFC 7807`, JSON-LD (`Organization`, `RealEstateAgent`/`Place`), `sitemap.ts`, `robots.ts` e `not-found.tsx`.
5. **Subutilização Interativa**: a riqueza de ativos reais (`public/media/*.jpg`, `public/media/*.mp4`, `public/media/sat/*.jpg`, `public/frames/*`) fica estática sem simulador de aeronave/pista nem comparador editorial dedicado do Atlas Satelital.

## 2. Objetivo & Barra de Qualidade (4x+)

Elevar a experiência digital do **MOZY Private Aviation Estate** ao nível de estúdio internacional de Private Wealth / Aviação Executiva, combinando autoridade arquitetônica, engenharia visual avançada e conversão institucional rastreável em **5 rotas reais** sobre **Next.js App Router + React 19 + TypeScript `strict` (`zero any`)**.

## 3. Arquitetura de Rotas e Capacidades FORJA 1.0 Exercitadas

Todas as rotas devem compor o `sitemap.ts` (`P14`: conteúdo real e denso em 100% das rotas):

1. **`/` — Home Cinematográfica & Tese Executiva**:
   - **Hero Híbrido WebGL2 (`hero-3d`)**: Pôster/imagem LCP renderizada no servidor (`public/media/estate-dusk.jpg` ou `public/media/hero.jpg`), canvas WebGL2 atmosférico em **chunk lazy carregado após o primeiro paint (`GL-LAZY-THREE` / shader leve com `ogl` ou GLSL nativo)** com tratamento de `webglcontextlost`/`webglcontextrestored`, pausa automática fora da viewport/aba oculta (`MOTION-OFFSCREEN`), relógio único `rAF` (`MOTION-SINGLE-CLOCK`), zero `setState` por frame (`MOTION-NO-SETSTATE-FRAME`), `<h1>` único (`SEO-H1-ONE`) e CTA primário visível na dobra em `1440`, `810` e `390`.
   - **Capítulo Scrollytelling Otimizado (`motion` + Lenis/GSAP)**: Sequência selecionada (`public/frames/approach` + cena de chegada) em ritmo cinematográfico enxuto, respeitando estritamente `prefers-reduced-motion: reduce` (substituição por quadro estático nítido + zero bloqueio de scroll).
   - **Composições Assimétricas & Bento Editorial (`ui-craft` + `effects-glass`)**: Visão macro (`60` residências, `3.000 m`, `1.200–1.800 acres`, `24/7`), coleções residenciais com alternância visual de superfícies, painel em vidro (`backdrop-filter` estritamente dentro de `@supports` com fallback opaco AA — `GLASS-SUPPORTS`), vídeo noturno (`public/media/night.mp4`) pausado fora da tela e resumo de Capital + Data Room CTA.
2. **`/aviacao` — Infraestrutura Aeronáutica & Simulador Interativo de Frota/Pista**:
   - Simulador interativo fiel aos dados reais (`G450 / G550`, `Global 6000`, `Global 7000 / 7500`, `Falcon 2000`, `Falcon 8X`, `Falcon 900XP` + `Founder Estates`, `Runway Signature`, `Reserve Estates`), demonstrando adequação à pista `3.000 × 45 m`, taxiway paralelo, configuração de hangar (`múltiplas aeronaves 3–4 pavimentos`, `privativo + taxiway`, `hangar central`), serviços (`Jet-A`, `Fire Rescue`, `IFR/GPS sujeito à aprovação`), Master Plan (`public/media/masterplan.jpg` / `masterplan-diagram.jpg`) e comparativo detalhado dos 4 benchmarks (`Jumbolair`, `Spruce Creek`, `Cameron Airpark`, `Wing South`, além de `Heaven's Landing`, `Pecan Plantation`, `SilverWing`).
3. **`/terrenos` — Atlas Satelital Interativo & Scorecard (Central Florida)**:
   - Explorador interativo com alternância entre vista satélite regional/zoom (`public/media/sat/overview-marked.jpg`, `overview.jpg`, `*-wide.jpg`, `*-close.jpg`) e fotografia local (`listing-*.jpg`) para **Honey Bee Ranch** (`1.100 acres`), **Peace River Legacy East** (`1.693 acres · $10,0M`) e **Osceola Ranch** (`1.230 acres · $5,5M`), tabela de corredores (`01..04`), matriz de 6 órgãos reguladores (`County/City`, `FAA`, `FDOT Aviation`, `FDEP/WMD`, `USACE/USFWS`, `FDOT Roads/Fire`) e Scorecard ponderado de seleção (`25% / 20% / 20% / 15% / 10% / 10%`).
4. **`/tese-capital` — Estrutura Financeira, Stage-Gates & Governança**:
   - Números com `tabular-nums`, faixas ilustrativas de investimento (`$10–50M+`, `$150–250M`, `$300–600M`, `$550M–$1,0B+`), metas de underwriting explícitas (`margem bruta 25–35% · líquida 15–25% · IRR 18–25%` com o respectivo aviso legal obrigatório), Capital Stack (`5–10%`, `20–35%`, `35–50%`, `10–25%`), Stage-Gates (`0..6`), 5 veículos societários (`Mozy / Sponsor`, `HoldCo`, `Land / DevCo`, `Airport OpCo`, `Club / Amenities`), 6 fontes de receita (`01..06`), cronograma (`0–84 meses`), Tecnologia Invisível (`4K/térmicas`, `fibra/Wi-Fi 7`, `KNX/Crestron/Lutron`, `microgrid 72–120 h`), Sponsor (`MOZY CONSTRUCTION INC.`, `Entity P18000088130`), plano de `90 dias` e FAQ em `<details>`.
5. **`/solicitar-acesso` — Data Room Confidencial & Contato Direto (`martech-seo`)**:
   - Banner + central de preferências de cookies com Consent Mode v2 negado por padrão (`TRACK-CONSENT-FIRST`), zero tags disparadas antes do aceite.
   - Preservação automática de `utm_*`, `gclid`, `fbclid`, `ttclid` da entrada até a submissão (`TRACK-UTM-FORM`).
   - Formulário acessível (`label`, `aria-describedby`, `aria-live`, honeypot anti-spam, prevenção de duplo envio) para qualificação (`Founder Estate`, `Runway Signature`, `Reserve Estate`, `LP / Equity Partner`, `Land / Co-Development`), enviando para `POST /api/leads` com validação Zod na borda e erros padronizados `RFC 7807` (`type`, `title`, `status`, `detail`, `traceId`).

## 4. Contrato Inegociável & Qualidade

- **15 Regras de Piso FORJA 1.0**: cumprimento integral (`TS-STRICT`, `DESIGN-TOKENS-ONLY`, `GLASS-SUPPORTS`, `MOTION-REDUCED`, `MOTION-SINGLE-CLOCK`, `MOTION-OFFSCREEN`, `MOTION-NO-SETSTATE-FRAME`, `GL-FALLBACK`, `GL-CONTEXT-LOST`, `GL-LAZY-THREE`, `SEO-H1-ONE`, `TRACK-CONSENT-FIRST`, `TRACK-UTM-FORM`, `CONTENT-NO-FABRICATION`, `GATE-EVIDENCE`, `SEO-SITEMAP-REAL`).
- **Segurança**: zero segredos, `.env.example` documentado se necessário, sem `dangerouslySetInnerHTML` não sanitizado, validação rigorosa em `/api/leads` e cabeçalhos seguros.
- **Português & Fontes Reais**: UI, metadados SEO, `DESIGN.md`, `README.md` e relatórios em Português claro; fontes tipográficas via `@fontsource/*` offline/local (nunca `system-ui`/`Arial` para títulos display).

## 5. Critérios de Aceite & Gates de Saída

- [ ] `DESIGN.md` e `.forja/journal.md` completos registrando as 3 direções avaliadas e tokens OKLCH escolhidos.
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` verdes (`scripts/verify.sh`).
- [ ] `node /data/home/orca/tools/forja/scripts/gate.mjs --url http://localhost:<porta> --project . --routes /,/aviacao,/terrenos,/tese-capital,/solicitar-acesso` com `.forja/gate/report.json` `summary.passed: true` nas larguras `1440`, `810` e `390`.
- [ ] Avaliação cega do subagente `jury` do FORJA retornando veredito **`SHIP`** com capturas revisadas.
- [ ] `/data/home/.local/bin/stackia-gate --repo <worktree> --agent claude` com saída `0`.
- [ ] Parecer Four-Eyes independente `APPROVED` de `bot:secops-auditor` (`grok`, `P0=0, P1=0`) via `stackia-cortex signoff`.
