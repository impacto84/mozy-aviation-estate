import type { Metadata } from "next";
import { ActApproach, ActHangar, ActVilla } from "@/components/home/HomeActs";
import { ClubBand, Collections, HangarPrelude, ResidencePrelude, Sponsor, TechList, Thesis } from "@/components/home/HomeEditorial";
import { Closing, NightFilm } from "@/components/home/HomeFilms";
import { AtlasSection, AviationSection, CapitalTeaser, Discipline } from "@/components/home/HomeInteractive";
import { JsonLd } from "@/components/seo/JsonLd";
import { placeJsonLd } from "@/lib/martech/seo/json-ld";
import { buildPageMetadata } from "@/lib/martech/seo/metadata";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/martech/seo/site";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Comunidade residencial de aviação privada na Central Florida",
    description: SITE_DESCRIPTION,
    path: "/",
    siteName: SITE_NAME,
    ogImageAlt: "MOZY Private Aviation Estate ao entardecer, com jato na pista privada",
  }),
  title: { absolute: `${SITE_NAME} — comunidade residencial de aviação privada na Central Florida` },
};

function homeJsonLd() {
  const url = siteUrl();
  return placeJsonLd({
    type: "Residence",
    name: SITE_NAME,
    description:
      "60 residências de altíssimo padrão com hangar, taxiway privativa e pista de 3.000 m (premissa inicial) para grandes jatos. Projeto conceitual, sujeito a aprovações.",
    url,
    image: `${url}/og.jpg`,
    containedIn: "Orlando · Central Florida",
  });
}

/**
 * Home em três atos filmados (aproximação, residência, hangar) separados por
 * capítulos editoriais e duas bandas de filme. Cada ato é independente na rolagem.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <ActApproach />
      <Thesis />
      <Collections />
      <ResidencePrelude />
      <ActVilla />
      <NightFilm />
      <HangarPrelude />
      <ActHangar />
      <AviationSection />
      <ClubBand />
      <TechList />
      <Discipline />
      <AtlasSection />
      <CapitalTeaser />
      <Sponsor />
      <Closing />
    </>
  );
}
