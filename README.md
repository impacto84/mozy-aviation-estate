# MOZY Private Aviation Estate — site institucional (Flagship V2)

Site de apresentação do **MOZY Private Aviation Estate**: comunidade residencial privada de
aviação executiva na região de Orlando / Central Florida (60 residências com hangar, taxiway
privativa e pista de 3.000 m), patrocinada pela MOZY CONSTRUCTION INC.

Construído sobre **Next.js 16 (App Router) + React 19 + TypeScript `strict`**, seguindo o
contrato **FORJA 1.0** (RFC-0001, ADR-0001). Todo o conteúdo factual vem de
`src/lib/site-data.ts` e `.forja/brief.md` — nada de número, nome ou aprovação inventados.

## Rotas

| Rota | Conteúdo |
| :-- | :-- |
| `/` | Home cinematográfica: hero híbrido (pôster + WebGL2 com `ogl`), capítulo de frames em três sequências, coleções, aviação, terrenos, capital e CTA do Data Room. |
| `/aviacao` | Pista 3.000 × 45 m (premissa), simulador interativo de frota × coleção, infraestrutura, master plan e benchmarks. |
| `/terrenos` | Atlas satelital interativo dos três terrenos candidatos, corredores, matriz regulatória e scorecard ponderado. |
| `/tese-capital` | Faixas de investimento, underwriting ilustrativo (com aviso legal), capital stack, stage-gates, veículos, receitas, cronograma, tecnologia, sponsor, plano de 90 dias e FAQ. |
| `/solicitar-acesso` | Data Room confidencial: formulário qualificado → `POST /api/leads`. |
| `POST /api/leads` | Validação Zod na borda, mesma origem, limite por IP, campo-isca, erros RFC 7807 (`type`, `title`, `status`, `detail`, `traceId`). |

Também: `sitemap.xml`, `robots.txt`, página 404 própria, JSON-LD (Organization, WebSite, Place, FAQPage).

## Arquitetura (FORJA 1.0)

```
src/
  app/            rotas (App Router), layout, sitemap/robots, route handler /api/leads
  components/     UI por domínio: hero, chapter, glass, motion, consent, lead, atlas, aviation, ds…
  lib/            regras puras: martech (consentimento, UTM, lead, RFC 7807), motion, dados do site
  styles/         tokens.css (fonte única de cor/tipo/espaço/movimento em OKLCH) + teste de integridade
public/           mídia real (fotos, vídeos, satélites, sequências de frames WebP)
.forja/           brief do projeto, journal de decisões e saída do gate (não versionada)
docs/             RFC, ADR e cópias de referência da V05
```

- Transporte (rotas/handler) separado das regras puras (`src/lib/**`, 100% testáveis sem navegador).
- CSS Modules consomem só tokens semânticos; direção visual em `DESIGN.md`.
- Consentimento primeiro: nenhuma tag dispara antes do aceite (Consent Mode v2 negado por padrão).
- Movimento: relógio único `rAF`, pausa fora da tela, respeito total a `prefers-reduced-motion`.

## Scripts

| Comando | O que faz |
| :-- | :-- |
| `npm run dev` | Servidor de desenvolvimento em `http://127.0.0.1:3140` (`PORT` muda a porta). |
| `npm run typecheck` | Gera os tipos de rota e roda `tsc --noEmit`. |
| `npm run lint` | ESLint (Next + TypeScript), zero avisos. |
| `npm run test` | Vitest em um único processo (`maxWorkers=1`, anti-OOM). |
| `npm run build` / `npm run start` | Build e servidor de produção. |
| `npm run verify` | `scripts/verify.sh`: typecheck → lint → testes → build. |
| `PORT=3140 sh scripts/serve.sh` | Sobe o build de produção em background (PID em `.forja/server.pid`). |

Todos os scripts pesados rodam com `NODE_OPTIONS=--max-old-space-size=1536` para caber em
contêineres de 4 GiB. Para instalar dependências: `npm ci` (versões fixas, `save-exact`).

## Variáveis de ambiente

Veja `.env.example` (sem segredos). Nenhuma é obrigatória para rodar localmente.

| Variável | Onde | Uso |
| :-- | :-- | :-- |
| `NEXT_PUBLIC_SITE_URL` | build | URL canônica (sitemap, canonical, Open Graph). |
| `NEXT_PUBLIC_GTM_ID` | navegador | Google Tag Manager; vazio = nenhuma tag. |
| `NEXT_PUBLIC_FORM_URL` | navegador | Formulário externo opcional. |
| `LEAD_WEBHOOK_URL` | servidor | Destino HTTPS do lead. |
| `LEADS_STORAGE_DIR` | servidor | Gravação NDJSON dos leads (padrão `.data/leads`, fora do git; `off` desliga). |

Sem nenhum destino de lead configurado, `/api/leads` responde `503` RFC 7807 em vez de fingir que guardou.

## Como verificar localmente

```sh
npm ci
./scripts/verify.sh                        # typecheck + lint + testes + build
PORT=3140 sh scripts/serve.sh              # servidor de produção em background
curl -fsS http://127.0.0.1:3140/sitemap.xml
node /data/home/orca/tools/forja/scripts/gate.mjs \
  --url http://127.0.0.1:3140 --project . \
  --routes /,/aviacao,/terrenos,/tese-capital,/solicitar-acesso --profile site
```

O gate grava `.forja/gate/report.json` (precisa de `"passed": true`) e as capturas em
`.forja/gate/shots/` nas larguras 1440, 810 e 390.

## Aviso legal

Material conceitual para discussão. Não constitui oferta de valores mobiliários, garantia de
aprovação, appraisal, orçamento ou recomendação jurídica, fiscal, aeronáutica ou ambiental.
Todos os dados devem ser validados por profissionais licenciados.
