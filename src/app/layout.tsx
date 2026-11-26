import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { MartechProvider } from "@/components/consent/MartechProvider";
import { ScrollProvider } from "@/components/motion/ScrollProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { resolveMartechConfig } from "@/lib/martech/config";
import { contactOrganizationJsonLd, webSiteJsonLd } from "@/lib/martech/seo/json-ld";
import { ORGANIZATION_NAME, SITE_DESCRIPTION, SITE_LANGUAGE, SITE_NAME } from "@/lib/martech/seo/site";
import { contact } from "@/lib/site-data";
import { siteUrl } from "@/lib/site-url";
import { fontVariables } from "./fonts";
import "@/styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "./" },
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NAME, images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#10141c",
};

/** Dados estruturados do site inteiro: só fatos do brief (nome, endereço, contato). */
function siteJsonLd() {
  const url = siteUrl();
  return [
    contactOrganizationJsonLd({
      name: ORGANIZATION_NAME,
      url,
      description: SITE_DESCRIPTION,
      logo: `${url}/media/logo.png`,
      telephone: "+1-754-271-6203",
      email: contact.email,
      address: {
        streetAddress: "220 Northeast 38th Street",
        addressLocality: "Oakland Park",
        addressRegion: "FL",
        addressCountry: "US",
      },
    }),
    webSiteJsonLd({ name: SITE_NAME, url, inLanguage: SITE_LANGUAGE }),
  ];
}

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const { gtmId } = resolveMartechConfig();
  return (
    <html lang={SITE_LANGUAGE} className={fontVariables}>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <MartechProvider gtmId={gtmId} hideBannerWithoutTracking={gtmId === null}>
          <ScrollProvider>
            <SiteHeader />
            <main id="conteudo">{children}</main>
            <SiteFooter />
          </ScrollProvider>
        </MartechProvider>
        <JsonLd data={siteJsonLd()} />
      </body>
    </html>
  );
}
