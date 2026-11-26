import type { ReactNode } from "react";
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

function CinematicBeat({
  id,
  image,
  video,
  alt,
  kicker,
  title,
  body,
}: {
  id: string;
  image: string;
  video?: string;
  alt: string;
  kicker: string;
  title: string;
  body?: string;
}) {
  return (
    <section id={id} className="relative min-h-[100svh] overflow-hidden">
      <MediaStage
        image={image}
        video={video}
        alt={alt}
        overlay="from-void/55 via-void/25 to-void/85"
      />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-20 pt-28 md:px-8 md:pb-28">
        <Reveal className="max-w-2xl">
          <p className="section-kicker">{kicker}</p>
          <h2 className="mt-5 text-3xl leading-[1.08] text-paper sm:text-5xl md:text-6xl">
            {title}
          </h2>
          {body ? <p className="mt-5 max-w-xl text-base leading-relaxed text-fog md:text-lg">{body}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}

function SectionShell({
  id,
  children,
  tone = "void",
}: {
  id?: string;
  children: ReactNode;
  tone?: "void" | "ink";
}) {
  return (
    <section
      id={id}
      className={tone === "ink" ? "relative bg-ink py-24 md:py-36" : "relative bg-void py-24 md:py-36"}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">{children}</div>
    </section>
  );
}

function StatRow() {
  return (
    <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-line pt-12 md:grid-cols-4">
      {stats.map((s, i) => (
        <Reveal key={s.label} delay={i * 70}>
          <p className="font-display text-4xl tracking-tight text-brass md:text-5xl">{s.value}</p>
          <p className="mt-3 max-w-[14rem] text-sm leading-relaxed text-fog">{s.label}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function Presentation() {
  return (
    <div id="topo" className="bg-void text-paper">
      <SiteNav />

      {/* Hero — one composition, brand-first, full-bleed */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/media/hero-cinematic.jpg"
            alt="Private jet on a luxury Florida aviation estate runway at dusk"
            className="hero-kenburns h-full w-full object-cover"
          />
          <div className="absolute inset-0 atmosphere" />
          <div className="absolute inset-0 bg-gradient-to-r from-void/80 via-void/35 to-void/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24">
          <p className="float-in font-display text-5xl tracking-[0.12em] text-paper sm:text-7xl md:text-8xl lg:text-9xl">
            MOZY
          </p>
          <h1 className="float-in-late mt-6 max-w-3xl font-display text-2xl leading-[1.12] text-paper sm:text-4xl md:text-5xl">
            Onde a casa encontra a pista.
          </h1>
          <p className="float-in-late mt-5 max-w-xl text-base leading-relaxed text-fog md:text-lg">
            Sessenta residências de altíssimo padrão, hangar em cada casa e uma pista para grandes
            jatos — a comunidade de aviação privada mais cobiçada da região de Orlando.
          </p>
          <div className="float-in-last mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contato"
              className="cta-primary inline-flex min-h-12 items-center justify-center px-8 text-sm font-medium tracking-[0.06em]"
            >
              Solicitar conversa
            </a>
            <a
              href="#aproximacao"
              className="cta-ghost inline-flex min-h-12 items-center justify-center px-8 text-sm tracking-[0.06em]"
            >
              Entrar na aproximação
            </a>
          </div>
        </div>
      </section>

      <CinematicBeat
        id="aproximacao"
        image="/media/runway-night.jpg"
        video="/media/closer.mp4"
        alt="Aproximação noturna à pista privada"
        kicker="Florida · Private Aviation Estate"
        title="Aproximação. Luzes acesas. Sol no mesmo lugar."
        body="Não um loteamento com pista — um território pensado para quem voa no quotidiano."
      />

      <CinematicBeat
        id="residencia"
        image="/media/living-hangar.jpg"
        alt="Living com vista para hangar e jato"
        kicker="Orlando · Founder Estate"
        title="Entrar na casa. A vista é a pista."
        body="Central Florida — carvalhos, relva, taxiway. A janela dá para o hangar."
      />

      <SectionShell id="visao" tone="ink">
        <Reveal>
          <p className="section-kicker">A visão</p>
          <h2 className="mt-5 max-w-4xl text-3xl leading-tight md:text-5xl">
            Viver, receber, trabalhar e voar com privacidade — sem abrir mão de um resort
            internacional.
          </h2>
        </Reveal>
        <StatRow />
      </SectionShell>

      <CinematicBeat
        id="gesto"
        image="/media/hangar-dual-cinematic.jpg"
        alt="Hangar com aeronaves integrado à residência"
        kicker="Casa + hangar"
        title="Entra. O jato já espera."
        body="Da taxiway ao nariz da aeronave — a pista como extensão do quotidiano."
      />

      <SectionShell>
        <Reveal>
          <p className="section-kicker">O sponsor</p>
          <h2 className="mt-5 max-w-3xl text-3xl md:text-5xl">
            Mozy combina execução de campo e visão de desenvolvimento.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-12 border-t border-line pt-12 md:grid-cols-2">
          <Reveal>
            <img
              src="/media/logo.png"
              alt="MOZY Construction Inc."
              className="mb-8 h-14 w-auto md:h-16"
            />
            <p className="section-kicker">Empresa</p>
            <p className="mt-4 text-xl tracking-wide">MOZY CONSTRUCTION INC.</p>
            <p className="mt-3 text-sm text-fog">
              Florida Corporation · Entity {contact.entity} · S Corporation
            </p>
            <p className="mt-4 text-sm text-fog">{contact.address}</p>
            <p className="text-sm text-fog">
              South Florida · Miami-Dade · Broward · Palm Beach · Orlando
            </p>
          </Reveal>
          <Reveal delay={80}>
            <p className="section-kicker">Papel</p>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-fog">
              <li className="border-l border-brass/40 pl-4">Originar e controlar o terreno</li>
              <li className="border-l border-brass/40 pl-4">Integrar os estudos de viabilidade</li>
              <li className="border-l border-brass/40 pl-4">
                Coordenar design-to-budget e construção
              </li>
              <li className="border-l border-brass/40 pl-4">
                Estruturar parceiros, capital e governança
              </li>
              <li className="border-l border-brass/40 pl-4">
                Construir uma marca residencial com disciplina operacional
              </li>
            </ul>
          </Reveal>
        </div>
      </SectionShell>

      <SectionShell id="residencias" tone="ink">
        <Reveal>
          <p className="section-kicker">Três produtos</p>
          <h2 className="mt-5 max-w-3xl text-3xl md:text-5xl">
            Três produtos. Um único padrão de excelência.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-0 border-t border-line lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 90}
              className="border-b border-line py-10 lg:border-b-0 lg:border-r lg:px-8 lg:py-12 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <p className="font-display text-5xl text-brass">{t.count}</p>
              <h3 className="mt-4 text-xl tracking-tight">{t.name}</h3>
              <ul className="mt-6 space-y-2 text-sm text-fog">
                <li>{t.acres}</li>
                <li>{t.size}</li>
                <li>{t.hangar}</li>
              </ul>
              <p className="mt-8 text-lg text-brass-soft">{t.price}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-fog">{t.note}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 grid gap-3 md:grid-cols-2">
          <img
            src="/media/aerial-estates.jpg"
            alt="Vista aérea da comunidade de aviação privada ao entardecer"
            className="h-72 w-full object-cover md:h-[28rem]"
          />
          <img
            src="/media/hangar-dual-cinematic.jpg"
            alt="Hangar de duas aeronaves integrado à residência"
            className="h-72 w-full object-cover md:h-[28rem]"
          />
        </div>
      </SectionShell>

      <section className="relative min-h-[85svh] overflow-hidden">
        <MediaStage
          image="/media/living-hangar.jpg"
          alt="Living com vista para hangar e jato privado"
          overlay="from-void/30 via-void/45 to-void/90"
        />
        <div className="relative z-10 mx-auto flex min-h-[85svh] max-w-7xl items-end px-5 py-24 md:px-8">
          <Reveal className="max-w-xl">
            <p className="section-kicker">Casa + hangar</p>
            <h2 className="mt-5 text-3xl md:text-5xl">
              Residência, hangar e operação projetados juntos.
            </h2>
            <p className="mt-5 text-fog">
              Casas de 3 a 4 pavimentos, hangar para uma ou várias aeronaves, taxiway privada e a
              pista como extensão do quotidiano — não como um apêndice.
            </p>
          </Reveal>
        </div>
      </section>

      <SectionShell id="aviacao">
        <Reveal>
          <p className="section-kicker">Plataforma</p>
          <h2 className="mt-5 max-w-3xl text-3xl md:text-5xl">
            Dimensionada para a aeronave crítica — não só para o comprimento da pista.
          </h2>
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-y border-line py-6">
          {aircraft.map((a) => (
            <span key={a} className="text-sm tracking-wide text-paper/85">
              {a}
            </span>
          ))}
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "3.000 × 45 m como premissa inicial",
            "Taxiway paralelo e áreas de proteção",
            "Terminal privado, apron e hangares",
            "Jet-A, Fire Rescue e meteorologia",
            "IFR / GPS sujeito à aprovação",
            "Operação privada e controlada",
          ].map((item, i) => (
            <Reveal key={item} delay={i * 40} className="border-l border-brass/35 pl-4 text-sm text-fog">
              {item}
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-20">
          <p className="section-kicker">Master plan conceitual</p>
          <h2 className="mt-5 max-w-3xl text-3xl md:text-5xl">
            O aeroporto organiza o território — sem dominar a vida residencial.
          </h2>
        </Reveal>
        <img
          src="/media/masterplan.jpg"
          alt="Master plan conceitual: pista, taxiway, 60 estates, Aviation Club e preservação"
          className="mt-10 w-full border border-line object-cover"
        />
        <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-5">
          {["Pista + taxiway", "60 estates", "Aviation Club", "Terminal + Jet-A", "Preservação"].map(
            (label) => (
              <p key={label} className="text-center text-sm text-fog md:text-left">
                {label}
              </p>
            ),
          )}
        </div>
        <p className="mt-4 text-xs text-fog">
          Ilustração conceitual. A implantação real será refeita sobre KML, survey, wetlands, wind
          rose e estudo de espaço aéreo.
        </p>
      </SectionShell>

      <section className="relative min-h-[75svh] overflow-hidden">
        <MediaStage
          image="/media/club-cinematic.jpg"
          alt="Aviation Club ao entardecer"
          overlay="from-void/20 via-void/40 to-void/85"
        />
        <div className="relative z-10 mx-auto flex min-h-[75svh] max-w-7xl items-end px-5 py-20 md:px-8">
          <Reveal>
            <p className="section-kicker">Aviation Club</p>
            <h2 className="mt-5 max-w-3xl text-3xl md:text-6xl">
              Hospitalidade seis estrelas para proprietários, convidados e tripulações.
            </h2>
            <p className="mt-5 max-w-lg text-fog">
              Restaurante · lounge · business center · wellness · piscina · simuladores · eventos.
            </p>
          </Reveal>
        </div>
      </section>

      <SectionShell tone="ink">
        <Reveal>
          <p className="section-kicker">Tecnologia invisível</p>
          <h2 className="mt-5 text-3xl md:text-5xl">
            Conveniência para o morador. Redundância para a operação.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 border-t border-line pt-12 md:grid-cols-2 lg:grid-cols-4">
          {tech.map((t, i) => (
            <Reveal key={t.n} delay={i * 70}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-brass">
                {t.n} · {t.title}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-fog">{t.body}</p>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <Reveal>
          <p className="section-kicker">Referências</p>
          <h2 className="mt-5 max-w-3xl text-3xl md:text-5xl">
            O melhor dos airparks — corrigindo os limites de cada um.
          </h2>
        </Reveal>
        <div className="mt-12 space-y-0 border-t border-line">
          {benchmarks.map((b, i) => (
            <Reveal
              key={b.name}
              delay={i * 50}
              className="flex flex-col gap-3 border-b border-line py-7 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <span className="font-display text-2xl text-brass">{b.n}</span>
              <div className="flex-1">
                <p className="text-lg">{b.name}</p>
                <p className="mt-1 text-sm text-fog">{b.take}</p>
              </div>
              <p className="text-sm text-brass-soft sm:max-w-xs sm:text-right">
                Trazemos {b.bring}
              </p>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-sm text-fog">
          Heaven’s Landing inspira o Aviation Club · Pecan Plantation amplia amenidades · SilverWing
          inspira lotes build-ready.
        </p>
      </SectionShell>

      <SectionShell id="terrenos" tone="ink">
        <Reveal>
          <p className="section-kicker">Originação · satélite real</p>
          <h2 className="mt-5 text-3xl md:text-5xl">De Orlando, no alto, até cada terreno.</h2>
          <p className="mt-4 max-w-2xl text-fog">
            Imagem de satélite real da Flórida Central. Os discos vermelhos marcam Honey Bee, Peace
            River e Osceola Ranch. Clique — ou role — e o mapa desce até o setor.
          </p>
        </Reveal>
        <SatelliteAtlas />
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.16em] text-fog">
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
                <tr key={c.rank} className="border-t border-line">
                  <td className="py-4 pr-4 text-brass">{c.rank}</td>
                  <td className="py-4 pr-4">{c.name}</td>
                  <td className="py-4 pr-4 text-fog">{c.connect}</td>
                  <td className="py-4 pr-4">{c.thesis}</td>
                  <td className="py-4 text-fog">{c.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionShell>

      <section className="relative min-h-[65svh] overflow-hidden">
        <MediaStage
          image="/media/runway-night.jpg"
          video="/media/night.mp4"
          alt="Pista privada à noite com luzes âmbar"
          overlay="from-void/40 via-void/35 to-void/85"
        />
        <div className="relative z-10 mx-auto flex min-h-[65svh] max-w-7xl items-center px-5 py-20 md:px-8">
          <Reveal>
            <p className="section-kicker">Disciplina</p>
            <h2 className="mt-5 max-w-3xl text-3xl md:text-5xl">
              Cada decisão atravessa sete gates antes de virar capital.
            </h2>
          </Reveal>
        </div>
      </section>

      <SectionShell id="capital">
        <div className="grid gap-6 border-y border-line py-10 sm:grid-cols-2 lg:grid-cols-7">
          {gates.map((g, i) => (
            <Reveal key={g.n} delay={i * 40} className="text-center lg:text-left">
              <p className="font-display text-3xl text-brass">{g.n}</p>
              <p className="mt-2 text-sm">{g.title}</p>
              <p className="mt-1 text-xs text-fog">{g.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-fog">
          Sem corredor de pista, aprovação aeronáutica ou bloco suficiente de uplands — o terreno é
          rejeitado.
        </p>

        <Reveal className="mt-20">
          <p className="section-kicker">Escala</p>
          <h2 className="mt-5 text-3xl md:text-5xl">Implantação por fases.</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {capital.map((c, i) => (
            <Reveal key={c.range} delay={i * 60}>
              <p className="text-xl text-brass">{c.range}</p>
              <p className="mt-3 text-sm text-fog">{c.label}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-xs text-fog">
          Faixas ilustrativas — não constituem orçamento, previsão, oferta ou garantia de retorno.
          Metas de underwriting: margem bruta 25–35% · líquida 15–25% · IRR 18–25%.
        </p>

        <Reveal className="mt-20">
          <p className="section-kicker">Sete anos</p>
          <h2 className="mt-5 text-3xl md:text-5xl">Valor criado desde o primeiro gate.</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-5">
          {timeline.map((t, i) => (
            <Reveal key={t.title} delay={i * 50}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-brass">{t.when}</p>
              <p className="mt-3 text-lg">{t.title}</p>
              <p className="mt-2 text-sm text-fog">{t.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20">
          <p className="section-kicker">Scorecard</p>
          <h2 className="mt-5 text-3xl md:text-5xl">Risco ajustado — não preço por acre.</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 md:grid-cols-2 lg:grid-cols-3">
          {scorecard.map((s, i) => (
            <Reveal key={s.title} delay={i * 40}>
              <p className="font-display text-3xl text-brass">{s.weight}</p>
              <p className="mt-3">{s.title}</p>
              <p className="mt-2 text-sm text-fog">{s.test}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-fog">
          Qualquer red flag crítico elimina o terreno, independentemente da pontuação.
        </p>

        <Reveal className="mt-20">
          <p className="section-kicker">Capital</p>
          <h2 className="mt-5 text-3xl md:text-5xl">
            Entra por gates. Ganha proteção conforme o risco cai.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((s, i) => (
            <Reveal key={s.title} delay={i * 50}>
              <p className="text-xl text-brass">{s.share}</p>
              <p className="mt-3">{s.title}</p>
              <p className="mt-2 text-sm text-fog">{s.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20">
          <p className="section-kicker">Riscos conhecidos</p>
          <h2 className="mt-5 text-3xl md:text-5xl">
            O que não se elimina entra no preço — ou na rejeição.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 md:grid-cols-2 lg:grid-cols-3">
          {risks.map((r, i) => (
            <Reveal key={r.title} delay={i * 40}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-brass">{r.level}</p>
              <p className="mt-3">{r.title}</p>
              <p className="mt-2 text-sm text-fog">{r.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20">
          <p className="section-kicker">Aprovações em paralelo</p>
          <h2 className="mt-5 text-3xl md:text-5xl">
            Seis frentes. Nenhuma isolada garante o empreendimento.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {regulators.map((r, i) => (
            <Reveal key={r.title} delay={i * 40}>
              <p className="text-brass">{r.title}</p>
              <p className="mt-2 text-sm text-fog">{r.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20">
          <p className="section-kicker">Estrutura</p>
          <h2 className="mt-5 text-3xl md:text-5xl">Separa desenvolvimento, ativos e operação.</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-5">
          {entities.map((e, i) => (
            <Reveal key={e.title} delay={i * 40}>
              <p>{e.title}</p>
              <p className="mt-2 text-sm text-fog">{e.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-fog">
          Após estabilização, Residential HOA + Airport Owners Association assumem a governança.
          Desenho conceitual — não é estrutura jurídica final.
        </p>

        <Reveal className="mt-20">
          <p className="section-kicker">Receita</p>
          <h2 className="mt-5 text-3xl md:text-5xl">
            A venda das casas é o motor. Serviços sustentam o ativo.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {revenues.map((r, i) => (
            <Reveal key={r.title} delay={i * 40}>
              <p className="text-[11px] text-brass">{r.n}</p>
              <p className="mt-3">{r.title}</p>
              <p className="mt-2 text-sm text-fog">{r.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-fog">
          HOA e operação aeroportuária devem ser sustentáveis sem depender de novas vendas.
        </p>
      </SectionShell>

      <section id="contato" className="relative min-h-[100svh] overflow-hidden bg-ink">
        <MediaStage
          image="/media/closer.jpg"
          video="/media/closer.mp4"
          alt="O jato da abertura — só para a frente, a cruzar a pista"
          overlay="from-void/25 via-void/40 to-void/92"
        />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-14 pt-28 md:px-8">
          <div className="max-w-lg md:max-w-xl">
            <Reveal>
              <p className="section-kicker">90 dias</p>
              <h2 className="mt-5 text-3xl leading-[1.12] md:text-4xl">
                Reduzir quatro terrenos a dois finalistas.
              </h2>
            </Reveal>
            <ol className="mt-8 space-y-3 text-sm text-fog">
              {days90.map((d, i) => (
                <li key={d} className="flex gap-3">
                  <span className="text-brass">0{i + 1}</span>
                  {d}
                </li>
              ))}
            </ol>
            <h3 className="mt-10 text-2xl leading-[1.15] md:text-3xl">
              Construir o endereço onde a aviação privada encontra o seu próximo padrão de vida.
            </h3>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={contact.phoneHref}
                className="cta-primary inline-flex min-h-12 items-center justify-center px-8 text-sm font-medium"
              >
                {contact.phone}
              </a>
              <a
                href={contact.emailHref}
                className="cta-ghost inline-flex min-h-12 items-center justify-center px-8 text-sm"
              >
                {contact.email}
              </a>
            </div>
            <p className="mt-6 text-sm text-fog">MOZY CONSTRUCTION INC. · {contact.web}</p>
            <p className="mt-6 max-w-md text-[11px] leading-relaxed text-fog/80">
              Material conceitual para discussão. Não constitui oferta de valores mobiliários,
              garantia de aprovação, appraisal, orçamento ou recomendação jurídica, fiscal,
              aeronáutica ou ambiental. Todos os dados devem ser validados por profissionais
              licenciados. Status de anúncios verificado em agosto de 2026.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-void px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-display text-lg tracking-[0.14em]">MOZY</p>
          <p className="text-center text-[11px] tracking-wide text-fog">
            CONFIDENTIAL · V06 · Para discussão · Não constitui oferta · {contact.phone} ·{" "}
            {contact.email}
          </p>
        </div>
      </footer>
    </div>
  );
}
