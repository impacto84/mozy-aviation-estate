/**
 * Textos editoriais preservados da apresentação V05 (`docs/legado/presentation-v05.tsx.txt`)
 * e do brief (`.forja/brief.md`). Só texto que já existia: nada aqui cria fato novo
 * (Piso P11 — CONTENT-NO-FABRICATION). Os números vêm de `site-data.ts`.
 */

export const BRAND = {
  name: "MOZY Private Aviation Estate",
  sponsor: "MOZY CONSTRUCTION INC.",
  sponsorDetail: "Florida Corporation · Entity P18000088130 · S Corporation",
  sponsorRegion: "South Florida · Miami-Dade · Broward · Palm Beach · Orlando",
  region: "Orlando · Central Florida",
} as const;

export const HERO = {
  kicker: "Florida · Private Aviation Estate",
  title: "Uma comunidade residencial de aviação privada.",
  body: "Não um loteamento com pista. Sessenta residências, hangar em cada casa e uma pista para grandes jatos, na região de Orlando.",
  positioning:
    "Um endereço privado e seguro desenhado para proprietários de aeronaves executivas, famílias UHNWI e investidores institucionais viverem, receberem, trabalharem e decolarem com autonomia completa.",
} as const;

/** Legenda obrigatória de toda imagem gerada do projeto (renders, não fotografia do local). */
export const CONCEPT_CAPTION = "Imagem: ilustração conceitual do projeto.";

export const CTA = {
  primary: "Solicitar acesso ao Data Room confidencial",
  primaryShort: "Acesso ao Data Room",
  aviation: "Explorar pista & frota",
  lands: "Atlas de terrenos (FL)",
  capital: "Tese de capital",
} as const;

export const VISION = {
  title: "Viver, receber, trabalhar e voar com privacidade — sem abrir mão de um resort internacional.",
} as const;

/** Capítulos das sequências reais de frames (`public/frames/*`), com as legendas da V05. */
export const CHAPTER_COPY = {
  approach: {
    label: "Aproximação",
    intro: {
      kicker: "Central Florida · Aproximação",
      title: "3.000 m de pista para grandes jatos.",
      body: "Sessenta residências, hangar em cada casa e uma pista para grandes jatos.",
    },
    mid: "A pista",
    arrival: { kicker: "O gesto", title: "O jato atravessa o quadro.", body: "Só para frente. Luzes acesas. Sol no mesmo lugar." },
  },
  villa: {
    label: "Residência",
    intro: {
      kicker: "Orlando · Founder Estate",
      title: "Entrar na casa. A vista é a pista.",
      body: "Carvalhos, relva e taxiway na Central Florida. Atrás das portas de vidro do living, o jato espera do outro lado.",
    },
    mid: "A casa",
    arrival: { kicker: "Você chegou", title: "A janela dá para o hangar.", body: "" },
  },
  hangar: {
    label: "Hangar",
    intro: {
      kicker: "Casa + hangar",
      title: "Entra. O jato já espera.",
      body: "Hangar privativo ligado à casa e à taxiway: da pista ao nariz da aeronave, sem sair de casa.",
    },
    mid: "Avança",
    arrival: { kicker: "O cotidiano", title: "Da pista à sala.", body: "" },
  },
} as const;

export const SPONSOR = {
  title: "MOZY combina execução de campo e visão de desenvolvimento.",
  roles: [
    "Originar e controlar o terreno",
    "Integrar os estudos de viabilidade",
    "Coordenar design-to-budget e construção",
    "Estruturar parceiros, capital e governança",
    "Construir uma marca residencial com disciplina operacional",
  ],
} as const;

export const COLLECTIONS = {
  title: "Três produtos. Um único padrão de excelência.",
} as const;

export const HANGAR_HOME = {
  title: "Residência, hangar e operação projetados juntos.",
  body: "Casas de 3 a 4 pavimentos, hangar para uma ou várias aeronaves, taxiway privada e a pista como extensão do cotidiano — não como um apêndice.",
} as const;

export const AVIATION = {
  title: "Dimensionada para a aeronave crítica — não só para o comprimento da pista.",
  infrastructure: [
    "3.000 × 45 m como premissa inicial",
    "Taxiway paralelo e áreas de proteção",
    "Terminal privado, apron e hangares",
    "Jet-A, Fire Rescue e meteorologia",
    "IFR / GPS sujeito à aprovação",
    "Operação privada e controlada",
  ],
  masterplanTitle: "O aeroporto organiza o território — sem dominar a vida residencial.",
  masterplanLabels: ["Pista + taxiway", "60 residências", "Aviation Club", "Terminal + Jet-A", "Preservação + segurança"],
  masterplanNote:
    "Ilustração conceitual. A implantação real será refeita sobre KML, survey, wetlands, wind rose e estudo de espaço aéreo.",
} as const;

export const CLUB = {
  title: "Hospitalidade seis estrelas para proprietários, convidados e tripulações.",
  amenities: "Restaurante · lounge · business center · wellness · piscina · simuladores · eventos.",
} as const;

export const TECH = {
  title: "Conveniência para o morador. Redundância para a operação.",
} as const;

export const BENCHMARKS = {
  title: "O melhor dos airparks — corrigindo os limites de cada um.",
  complementary: "Heaven’s Landing inspira o Aviation Club · Pecan Plantation amplia amenidades · SilverWing inspira lotes build-ready.",
} as const;

export const LANDS_HERO =
  "Honey Bee Ranch, Peace River Legacy East e Osceola Ranch: três candidatos na Central Florida, avaliados por espaço aéreo, ambiental, zoning e economia antes do preço.";

export const LANDS = {
  title: "De Orlando, no alto, até cada terreno.",
  body: "Imagem de satélite real da Flórida Central. Os marcadores indicam Honey Bee, Peace River e Osceola Ranch.",
} as const;

export const DISCIPLINE = {
  title: "Cada decisão atravessa sete gates antes de virar capital.",
  rejection: "Sem corredor de pista, aprovação aeronáutica ou bloco suficiente de uplands — o terreno é rejeitado.",
  scaleTitle: "Implantação por fases.",
  capitalDisclaimer:
    "Faixas ilustrativas — não constituem orçamento, previsão, oferta ou garantia de retorno. Metas de underwriting: margem bruta 25–35% · líquida 15–25% · IRR 18–25%.",
  timelineTitle: "Valor criado desde o primeiro gate.",
  scorecardTitle: "Risco ajustado — não preço por acre.",
  scorecardNote: "Qualquer red flag crítico elimina o terreno, independentemente da pontuação.",
  stackTitle: "Entra por gates. Ganha proteção conforme o risco cai.",
  risksTitle: "O que não se elimina entra no preço — ou na rejeição.",
  regulatorsTitle: "Seis frentes. Nenhuma isolada garante o empreendimento.",
  entitiesTitle: "Separa desenvolvimento, ativos e operação.",
  entitiesNote:
    "Após estabilização, Residential HOA + Airport Owners Association assumem a governança. Desenho conceitual — não é estrutura jurídica final.",
  revenuesTitle: "A venda das casas é o motor. Serviços sustentam o ativo.",
  revenuesNote: "HOA e operação aeroportuária devem ser sustentáveis sem depender de novas vendas.",
  days90Title: "Reduzir os três terrenos candidatos a dois finalistas.",
  closing: "Construir o endereço onde a aviação privada encontra o seu próximo padrão de vida.",
} as const;

export const UNDERWRITING = {
  grossMargin: "25–35%",
  netMargin: "15–25%",
  irr: "18–25%",
} as const;

export const LEGAL = {
  disclaimer:
    "Material conceitual para discussão. Não constitui oferta de valores mobiliários, garantia de aprovação, appraisal, orçamento ou recomendação jurídica, fiscal, aeronáutica ou ambiental. Todos os dados devem ser validados por profissionais licenciados. Status de anúncios verificado em agosto de 2026.",
  footer: "Confidencial · Para discussão · Não constitui oferta",
} as const;
