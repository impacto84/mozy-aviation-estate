import {
  aircraft,
  benchmarks,
  capital,
  contact,
  corridors,
  days90,
  entities,
  gates,
  regulators,
  revenues,
  risks,
  scorecard,
  stack,
  stats,
  tech,
  tiers,
  timeline,
} from "@/lib/site-data";
import { SatelliteAtlas } from "./satellite-map";
import { MediaStage } from "./media-stage";
import { Reveal } from "./reveal";
import { SiteNav } from "./nav";
import { Scrollymation } from "./scrollymation";

export function Presentation() {
  return (
    <div id="topo" className="bg-void text-fg">
      <SiteNav />

      <Scrollymation
        id="aproximacao"
        dir="/frames/approach"
        count={40}
        heightVh={360}
        intro={{
          kicker: "Florida · Private Aviation Estate · V05",
          title: "Uma comunidade residencial de aviação privada.",
          body: "Não um loteamento com pista. Sessenta residências, hangar em cada casa e uma pista para grandes jatos — o endereço mais cobiçado da região de Orlando.",
        }}
        mid="A pista"
        arrival={{
          kicker: "O gesto",
          title: "O jato atravessa o quadro.",
          body: "Só para frente. Luzes acesas. Sol no mesmo lugar.",
        }}
      />

      <Scrollymation
        id="residencia"
        dir="/frames/villa"
        count={64}
        heightVh={380}
        midAt={0.56}
        intro={{
          kicker: "Founder Estate",
          title: "Uma villa. Um scroll. A casa à beira da pista.",
          body: "Desce das nuvens, atravessa a sala, chega à água — o quotidiano de quem vive onde o jato pousa.",
        }}
        mid="Entre"
        arrival={{
          kicker: "Você chegou",
          title: "A vista espera.",
        }}
      />

      <section id="visao" className="relative bg-navy py-24 md:py-36">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">A visão</p>
            <h2 className="font-display mt-4 max-w-4xl text-3xl leading-tight md:text-5xl">
              Viver, receber, trabalhar e voar com privacidade — sem abrir mão de um resort
              internacional.
            </h2>
          </Reveal>
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <p className="font-display text-4xl text-gold md:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm text-muted">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Scrollymation
        id="gesto"
        dir="/frames/hangar"
        count={40}
        heightVh={320}
        midAt={0.45}
        intro={{
          kicker: "Casa + hangar",
          title: "O jato pousa. Cruza a taxiway. Entra no hangar da casa.",
          body: "Cada residência é projetada com hangar, circulação e operação desde o primeiro traço. Da pista à sala — sem aeroporto público, sem espera.",
        }}
        mid="Taxiway"
        arrival={{
          kicker: "O quotidiano",
          title: "Da pista à sala.",
        }}
      />

      <section className="bg-void py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">O sponsor</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Mozy combina execução de campo e visão de desenvolvimento.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="rounded-lg border border-border bg-surface/80 p-8">
              <img
                src="/media/logo.png"
                alt="MOZY Construction Inc."
                className="mb-6 h-14 w-auto md:h-16"
              />
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Empresa</p>
              <p className="mt-3 text-xl">MOZY CONSTRUCTION INC.</p>
              <p className="mt-2 text-sm text-muted">
                Florida Corporation · Entity {contact.entity} · S Corporation
              </p>
              <p className="mt-4 text-sm text-muted">{contact.address}</p>
              <p className="text-sm text-muted">South Florida · Miami-Dade · Broward · Palm Beach · Orlando</p>
            </Reveal>
            <Reveal delay={80} className="rounded-lg border border-border bg-surface/80 p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Papel</p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li>Originar e controlar o terreno</li>
                <li>Integrar os estudos de viabilidade</li>
                <li>Coordenar design-to-budget e construção</li>
                <li>Estruturar parceiros, capital e governança</li>
                <li>Construir uma marca residencial com disciplina operacional</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="residencias" className="relative overflow-hidden bg-navy py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Três produtos</p>
            <h2 className="font-display mt-4 max-w-3xl text-3xl md:text-5xl">
              Três produtos. Um único padrão de excelência.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {tiers.map((t, i) => (
              <Reveal key={t.name} delay={i * 90} className="rounded-lg border border-border bg-void p-8">
                <p className="font-display text-5xl text-gold">{t.count}</p>
                <h3 className="mt-3 text-xl">{t.name}</h3>
                <ul className="mt-5 space-y-2 text-sm text-muted">
                  <li>{t.acres}</li>
                  <li>{t.size}</li>
                  <li>{t.hangar}</li>
                </ul>
                <p className="mt-6 text-lg text-gold-soft">{t.price}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{t.note}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <img
              src="/media/estate-dusk.jpg"
              alt="Comunidade de aviação privada ao entardecer — hangares e taxiway"
              className="h-72 w-full rounded-lg object-cover md:h-96"
            />
            <img
              src="/media/hangar-dual.jpg"
              alt="Hangar de duas aeronaves integrado à residência"
              className="h-72 w-full rounded-lg object-cover md:h-96"
            />
          </div>
        </div>
      </section>

      <section className="relative min-h-[80svh] overflow-hidden">
        <MediaStage
          image="/media/hangar-dual.jpg"
          alt="Interior do hangar com duas aeronaves e living integrado"
          overlay="from-void/20 via-void/40 to-void"
        />
        <div className="relative z-10 mx-auto flex min-h-[80svh] max-w-6xl items-center px-5 py-24 md:px-8">
          <Reveal className="max-w-xl rounded-lg border border-border bg-void/70 p-8 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Casa + hangar</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Residência, hangar e operação projetados juntos.
            </h2>
            <p className="mt-5 text-muted">
              Casas de 3 a 4 pavimentos, hangar para uma ou várias aeronaves, taxiway privada e
              a pista como extensão do quotidiano — não como um apêndice.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="aviacao" className="bg-void py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Plataforma</p>
            <h2 className="font-display mt-4 max-w-3xl text-3xl md:text-5xl">
              Dimensionada para a aeronave crítica — não só para o comprimento da pista.
            </h2>
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-3">
            {aircraft.map((a) => (
              <span
                key={a}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-fg"
              >
                {a}
              </span>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "3.000 × 45 m como premissa inicial",
              "Taxiway paralelo e áreas de proteção",
              "Terminal privado, apron e hangares",
              "Jet-A, Fire Rescue e meteorologia",
              "IFR / GPS sujeito à aprovação",
              "Operação privada e controlada",
            ].map((item, i) => (
              <Reveal key={item} delay={i * 40} className="rounded-lg border border-border p-5 text-sm text-muted">
                {item}
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-16">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Master plan conceitual</p>
            <h2 className="font-display mt-4 max-w-3xl text-3xl md:text-5xl">
              O aeroporto organiza o território — sem dominar a vida residencial.
            </h2>
          </Reveal>
          <img
            src="/media/masterplan.jpg"
            alt="Master plan conceitual: pista, taxiway, 60 estates, Aviation Club e preservação"
            className="mt-10 w-full rounded-lg border border-border object-cover"
          />
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            {["Pista + taxiway", "60 estates", "Aviation Club", "Terminal + Jet-A", "Preservação + segurança"].map(
              (label) => (
                <p
                  key={label}
                  className="rounded-lg border border-border px-4 py-3 text-center text-sm text-muted"
                >
                  {label}
                </p>
              ),
            )}
          </div>
          <p className="mt-4 text-xs text-muted">
            Ilustração conceitual. A implantação real será refeita sobre KML, survey, wetlands, wind rose e
            estudo de espaço aéreo.
          </p>
        </div>
      </section>

      <section className="relative min-h-[70svh] overflow-hidden">
        <MediaStage image="/media/club.jpg" alt="Aviation Club ao entardecer" />
        <div className="relative z-10 mx-auto flex min-h-[70svh] max-w-6xl items-end px-5 py-20 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Aviation Club</p>
            <h2 className="font-display mt-4 max-w-3xl text-3xl md:text-6xl">
              Hospitalidade seis estrelas para proprietários, convidados e tripulações.
            </h2>
            <p className="mt-5 max-w-lg text-muted">
              Restaurante · lounge · business center · wellness · piscina · simuladores · eventos.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-navy py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Tecnologia invisível</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Conveniência para o morador. Redundância para a operação.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tech.map((t, i) => (
              <Reveal key={t.n} delay={i * 70} className="rounded-lg border border-border bg-void p-6">
                <p className="text-xs text-gold">
                  {t.n} · {t.title}
                </p>
                <p className="mt-3 text-sm text-muted">{t.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-void py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Referências</p>
            <h2 className="font-display mt-4 max-w-3xl text-3xl md:text-5xl">
              O melhor dos airparks — corrigindo os limites de cada um.
            </h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {benchmarks.map((b, i) => (
              <Reveal
                key={b.name}
                delay={i * 50}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface/60 p-6 sm:flex-row sm:items-center"
              >
                <span className="font-display text-2xl text-gold">{b.n}</span>
                <div className="flex-1">
                  <p className="text-lg">{b.name}</p>
                  <p className="text-sm text-muted">{b.take}</p>
                </div>
                <p className="text-sm text-gold-soft">Trazemos {b.bring}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">
            Heaven’s Landing inspira o Aviation Club · Pecan Plantation amplia amenidades · SilverWing
            inspira lotes build-ready.
          </p>
        </div>
      </section>

      <section id="terrenos" className="bg-navy py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Originação · satélite real</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              De Orlando, no alto, até cada terreno.
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Imagem de satélite real da Flórida Central. Os discos vermelhos marcam Honey Bee,
              Peace River e Osceola Ranch. Clique — ou role — e o mapa desce até o setor.
            </p>
          </Reveal>
          <SatelliteAtlas />
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="py-3 pr-4">Rank</th>
                  <th className="py-3 pr-4">Corredor</th>
                  <th className="py-3 pr-4">Conectividade</th>
                  <th className="py-3 pr-4">Tese</th>
                  <th className="py-3">Risco</th>
                </tr>
              </thead>
              <tbody>
                {corridors.map((c) => (
                  <tr key={c.rank} className="border-t border-border">
                    <td className="py-4 pr-4 text-gold">{c.rank}</td>
                    <td className="py-4 pr-4">{c.name}</td>
                    <td className="py-4 pr-4 text-muted">{c.connect}</td>
                    <td className="py-4 pr-4">{c.thesis}</td>
                    <td className="py-4 text-muted">{c.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="relative min-h-[60svh] overflow-hidden">
        <MediaStage
          image="/media/night.jpg"
          video="/media/night.mp4"
          alt="Pista privada à noite com luzes âmbar"
        />
        <div className="relative z-10 mx-auto flex min-h-[60svh] max-w-6xl items-center px-5 py-20 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Disciplina</p>
            <h2 className="font-display mt-4 max-w-3xl text-3xl md:text-5xl">
              Cada decisão atravessa sete gates antes de virar capital.
            </h2>
          </Reveal>
        </div>
      </section>

      <section id="capital" className="bg-void py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
            {gates.map((g, i) => (
              <Reveal key={g.n} delay={i * 40} className="rounded-lg border border-border p-4 text-center">
                <p className="font-display text-2xl text-gold">{g.n}</p>
                <p className="mt-1 text-sm">{g.title}</p>
                <p className="mt-1 text-xs text-muted">{g.body}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Sem corredor de pista, aprovação aeronáutica ou bloco suficiente de uplands — o
            terreno é rejeitado.
          </p>
          <Reveal className="mt-16">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Escala</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">Implantação por fases.</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capital.map((c, i) => (
              <Reveal key={c.range} delay={i * 60} className="rounded-lg border border-border bg-navy p-6">
                <p className="text-xl text-gold">{c.range}</p>
                <p className="mt-2 text-sm text-muted">{c.label}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted">
            Faixas ilustrativas — não constituem orçamento, previsão, oferta ou garantia de
            retorno. Metas de underwriting: margem bruta 25–35% · líquida 15–25% · IRR 18–25%.
          </p>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Sete anos</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Valor criado desde o primeiro gate.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {timeline.map((t, i) => (
              <Reveal key={t.title} delay={i * 50} className="rounded-lg border border-border p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">{t.when}</p>
                <p className="mt-2 text-lg">{t.title}</p>
                <p className="mt-2 text-sm text-muted">{t.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Scorecard</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Risco ajustado — não preço por acre.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scorecard.map((s, i) => (
              <Reveal key={s.title} delay={i * 40} className="rounded-lg border border-border bg-navy p-6">
                <p className="font-display text-2xl text-gold">{s.weight}</p>
                <p className="mt-2">{s.title}</p>
                <p className="mt-2 text-sm text-muted">{s.test}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Qualquer red flag crítico elimina o terreno, independentemente da pontuação.
          </p>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Capital</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Entra por gates. Ganha proteção conforme o risco cai.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((s, i) => (
              <Reveal key={s.title} delay={i * 50} className="rounded-lg border border-border p-6">
                <p className="text-xl text-gold">{s.share}</p>
                <p className="mt-2">{s.title}</p>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Riscos conhecidos</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              O que não se elimina entra no preço — ou na rejeição.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {risks.map((r, i) => (
              <Reveal key={r.title} delay={i * 40} className="rounded-lg border border-border p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">{r.level}</p>
                <p className="mt-2">{r.title}</p>
                <p className="mt-2 text-sm text-muted">{r.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Aprovações em paralelo</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Seis frentes. Nenhuma isolada garante o empreendimento.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regulators.map((r, i) => (
              <Reveal key={r.title} delay={i * 40} className="rounded-lg border border-border p-6">
                <p className="text-gold">{r.title}</p>
                <p className="mt-2 text-sm text-muted">{r.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Estrutura</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              Separa desenvolvimento, ativos e operação.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {entities.map((e, i) => (
              <Reveal key={e.title} delay={i * 40} className="rounded-lg border border-border p-5">
                <p>{e.title}</p>
                <p className="mt-2 text-sm text-muted">{e.body}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Após estabilização, Residential HOA + Airport Owners Association assumem a governança.
            Desenho conceitual — não é estrutura jurídica final.
          </p>

          <Reveal className="mt-20">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Receita</p>
            <h2 className="font-display mt-4 text-3xl md:text-5xl">
              A venda das casas é o motor. Serviços sustentam o ativo.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {revenues.map((r, i) => (
              <Reveal key={r.title} delay={i * 40} className="rounded-lg border border-border p-6">
                <p className="text-xs text-gold">{r.n}</p>
                <p className="mt-2">{r.title}</p>
                <p className="mt-2 text-sm text-muted">{r.body}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            HOA e operação aeroportuária devem ser sustentáveis sem depender de novas vendas.
          </p>
        </div>
      </section>

      <section id="contato" className="relative min-h-[100svh] overflow-hidden bg-navy">
        <MediaStage
          image="/media/closer.jpg"
          video="/media/closer.mp4"
          alt="O jato da abertura — só para a frente, a cruzar a pista"
          overlay="from-void/20 via-void/35 to-void/90"
        />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-14 pt-28 md:px-8">
          <div className="max-w-lg md:max-w-xl">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.28em] text-gold">90 dias</p>
              <h2 className="font-display mt-4 text-3xl leading-[1.12] md:text-4xl">
                Reduzir quatro terrenos a dois finalistas.
              </h2>
            </Reveal>
            <ol className="mt-8 space-y-3 text-sm text-muted">
              {days90.map((d, i) => (
                <li key={d} className="flex gap-3">
                  <span className="text-gold">0{i + 1}</span>
                  {d}
                </li>
              ))}
            </ol>
            <h3 className="font-display mt-10 text-2xl leading-[1.15] md:text-3xl">
              Construir o endereço onde a aviação privada encontra o seu próximo padrão de vida.
            </h3>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={contact.phoneHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-medium text-void transition-transform duration-150 active:scale-[0.96]"
              >
                {contact.phone}
              </a>
              <a
                href={contact.emailHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/50 px-8 py-3 text-sm text-gold"
              >
                {contact.email}
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">MOZY CONSTRUCTION INC. · {contact.web}</p>
            <p className="mt-6 max-w-md text-[11px] leading-relaxed text-muted">
              Material conceitual para discussão. Não constitui oferta de valores mobiliários,
              garantia de aprovação, appraisal, orçamento ou recomendação jurídica, fiscal,
              aeronáutica ou ambiental. Todos os dados devem ser validados por profissionais
              licenciados. Status de anúncios verificado em agosto de 2026.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-void px-5 py-6 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img src="/media/logo-nav.png" alt="MOZY Construction Inc." className="h-8 w-auto" />
          <p className="text-center text-[11px] tracking-wide text-muted">
            CONFIDENTIAL · V05 · Para discussão · Não constitui oferta · {contact.phone} ·{" "}
            {contact.email}
          </p>
        </div>
      </footer>
    </div>
  );
}
