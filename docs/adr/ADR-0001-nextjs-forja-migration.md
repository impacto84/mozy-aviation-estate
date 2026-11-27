# ADR-0001: Migração da Base Vite/TanStack/PGlite para Next.js App Router + FORJA 1.0

- **Status**: `Aceita`
- **Data**: `2026-11-26`
- **RFC Relacionada**: `docs/specs/RFC-0001-forja-studio-flagship.md`

---

## 1. Contexto
O repositório `mozy-aviation-estate` nasceu sobre um workspace genérico (`app-builder-workspace`) com Vite, TanStack Start/Router, Nitro, PGlite local, BetterAuth, Kysely e biblioteca `multiplayer/p2p.ts` — dependências pesadas de aplicação multi-usuário/SaaS usadas apenas para servir uma apresentação estática de uma página só (`Presentation`). Isso introduz superfície desnecessária de ataque/manutenção, atrasa builds e impede o uso direto das receitas compiladas, rotas multi-página de SEO técnico (`sitemap.ts`, `robots.ts`, `metadata`) e do gate determinístico em navegador real do **FORJA 1.0** (`/data/home/orca/tools/forja/fixtures/next-app`).

## 2. Decisão
Migrar a aplicação na branch `feat/forja-flagship-v2` para **Next.js App Router + React 19 + TypeScript `strict` (`"strict": true`, zero `any`) + CSS Modules (`tokens.css` em OKLCH) + `@fontsource/*` local**, aproveitando as receitas testadas do FORJA 1.0 e preservando integralmente todos os ativos de mídia (`public/media/**`, `public/frames/**`, `public/favicon.*`, `public/og.jpg`). Os dados de domínio (`src/lib/site-data.ts`) são tipados e estruturados para alimentar as 5 rotas reais (`/`, `/aviacao`, `/terrenos`, `/tese-capital`, `/solicitar-acesso`) e a Route Handler `POST /api/leads` (com validação Zod e erros `RFC 7807`).

## 3. Alternativas Consideradas
| Alternativa | Prós | Contras | Decisão |
| :--- | :--- | :--- | :--- |
| **Opção A (Escolhida): Next.js App Router + Fixture FORJA 1.0** | SSR limpo para SEO/LCP e pôster Hero 3D; code-splitting automático para chunk `three`/WebGL2; Route Handler nativa para `POST /api/leads`; compatível com 100% do `gate.mjs` + Martech/SEO | Requer substituição limpa do `package.json`/build Vite preservando `public/` e dados de domínio | **Escolhida** |
| **Opção B: Evoluir sobre TanStack Start + PGlite + BetterAuth** | Evita troca de bundler | Mantém ~30 pacotes inutilizados (PGlite WASM, Auth SQL, P2P multiplayer), não usa as receitas/gates nativos Next.js do FORJA 1.0 e complica SEO multi-rota e chunking WebGL | **Descartada** |

## 4. Consequências
- **Positivas**: Redução drástica de código morto, carregamento SSR imediato na dobra, lazy loading real do canvas 3D após pintura do hero, 5 rotas focadas para investidores/compradores, Consent Mode v2 + UTM + Data Room funcional e auditoria determinística via Chromium (`1440/810/390`).
- **Riscos & Mitigação**: A alteração de stack é executada em branch isolada (`feat/forja-flagship-v2`) sem sobrescrever a `main` até aprovação final; `src/lib/site-data.ts` e `public/media/**` + `public/frames/**` servem como fonte única imutável de fatos e mídia (`P11`).
