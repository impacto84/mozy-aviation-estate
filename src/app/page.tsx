import type { Metadata } from "next";
import { ChapterPlayer } from "@/components/chapter/ChapterPlayer";
import { AviationTeaser } from "@/components/home/AviationTeaser";
import { CapitalTeaser } from "@/components/home/CapitalTeaser";
import { Closing } from "@/components/home/Closing";
import { ClubBand } from "@/components/home/ClubBand";
import { Collections } from "@/components/home/Collections";
import { Discipline } from "@/components/home/Discipline";
import { HangarGlass } from "@/components/home/HangarGlass";
import { HomeHero } from "@/components/home/HomeHero";
import { LandsTeaser } from "@/components/home/LandsTeaser";
import { Sponsor } from "@/components/home/Sponsor";
import { TechList } from "@/components/home/TechList";
import { Vision } from "@/components/home/Vision";
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
    ogImageAlt: "MOZY Private Aviation Estate ao entardecer, com jato na taxiway",
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

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <HomeHero />
      <Vision />
      <ChapterPlayer />
      <Collections />
      <HangarGlass />
      <AviationTeaser />
      <ClubBand />
      <TechList />
      <Discipline />
      <LandsTeaser />
      <CapitalTeaser />
      <Sponsor />
      <Closing />
    </>
  );
}
