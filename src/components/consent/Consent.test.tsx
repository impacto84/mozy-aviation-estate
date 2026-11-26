import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_STORAGE_KEY, consent } from "@/lib/martech/consent";
import { readConsentCommands } from "@/lib/martech/consent-mode";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/martech/utm";
import { AttributionCapture } from "./AttributionCapture";
import { ConsentPreferencesButton } from "./ConsentPreferencesButton";
import { MartechProvider } from "./MartechProvider";
import { TEST_GTM_ID, eventsNamed, gtmScripts, installDialogStub, resetMartechBrowserState } from "./test-support";
import { useTrack } from "./useMartech";

const navigation = vi.hoisted(() => ({ pathname: "/demo/lead" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

function renderProvider(gtmId: string | null = TEST_GTM_ID) {
  return render(
    <MartechProvider gtmId={gtmId} policyHref="/privacidade">
      <p>Conteúdo da página</p>
      <ConsentPreferencesButton />
    </MartechProvider>,
  );
}

function consentActions(): readonly string[] {
  return readConsentCommands(window.dataLayer ?? []).map((command) => command.action);
}

beforeEach(() => {
  installDialogStub();
  navigation.pathname = "/demo/lead";
});

afterEach(() => {
  resetMartechBrowserState();
});

describe("MartechProvider e aviso de cookies", () => {
  it("na primeira visita mostra o aviso, nega tudo por padrão e não carrega tag", () => {
    renderProvider();

    const banner = screen.getByRole("region", { name: "Aviso de cookies" });
    expect(within(banner).getByRole("button", { name: "Recusar" })).toBeVisible();
    expect(within(banner).getByRole("button", { name: "Preferências" })).toBeVisible();
    expect(within(banner).getByRole("button", { name: "Aceitar" })).toBeVisible();
    expect(within(banner).getByRole("link", { name: "Política de privacidade" })).toHaveAttribute("href", "/privacidade");
    expect(consentActions()).toEqual(["default"]);
    expect(gtmScripts()).toHaveLength(0);
    expect(eventsNamed("page_view")).toHaveLength(0);
  });

  it("expõe o contrato de marcação que o gate usa para achar o aviso e o botão de aceite", () => {
    renderProvider();

    expect(document.querySelector('[data-forja-consent="banner"]')).not.toBeNull();
    expect(document.querySelector('[data-forja-consent="accept"]')).toHaveTextContent("Aceitar");
    expect(document.querySelector('[data-forja-consent="reject"]')).toHaveTextContent("Recusar");
  });

  it("aceitar: guarda a escolha, some com o aviso, carrega a tag uma vez e entrega o page_view da fila", async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByRole("button", { name: "Aceitar" }));

    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    expect(consent.get().choices).toEqual({ analytics: true, marketing: true });
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).not.toBeNull();
    expect(consentActions()).toEqual(["default", "update"]);
    expect(gtmScripts()).toHaveLength(1);
    expect(eventsNamed("page_view")).toEqual([expect.objectContaining({ page_path: "/demo/lead" })]);
    expect(screen.getByRole("status")).toHaveTextContent("Preferências de cookies salvas.");
  });

  it("recusar: guarda a recusa, some com o aviso e não carrega tag nem evento", async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByRole("button", { name: "Recusar" }));

    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    expect(consent.get()).toMatchObject({ status: "decided", choices: { analytics: false, marketing: false } });
    expect(gtmScripts()).toHaveLength(0);
    expect(eventsNamed("page_view")).toHaveLength(0);
  });

  it("preferências: abre o diálogo sem nada marcado e salva só a categoria escolhida", async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByRole("button", { name: "Preferências" }));
    const dialog = screen.getByRole("dialog", { name: "Preferências de cookies" });
    const analytics = within(dialog).getByRole("checkbox", { name: "Medição" });
    const marketing = within(dialog).getByRole("checkbox", { name: "Anúncios" });
    expect(analytics).not.toBeChecked();
    expect(marketing).not.toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: "Necessários" })).toBeDisabled();

    await user.click(analytics);
    await user.click(within(dialog).getByRole("button", { name: "Salvar escolhas" }));

    expect(consent.get().choices).toEqual({ analytics: true, marketing: false });
    expect(dialog).not.toHaveAttribute("open");
    expect(readConsentCommands(window.dataLayer ?? []).at(-1)?.state).toMatchObject({ analytics_storage: "granted", ad_storage: "denied" });
    expect(gtmScripts()).toHaveLength(1);
  });

  it("cancelar o diálogo não muda a escolha e o aviso continua", async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByRole("button", { name: "Preferências" }));
    const dialog = screen.getByRole("dialog", { name: "Preferências de cookies" });
    await user.click(within(dialog).getByRole("checkbox", { name: "Anúncios" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(consent.get().status).toBe("unknown");
    expect(screen.getByRole("region", { name: "Aviso de cookies" })).toBeVisible();
  });

  it("visitante que já decidiu não vê o aviso e pode rever a escolha pelo botão permanente", async () => {
    const user = userEvent.setup();
    consent.acceptAll();
    renderProvider();
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Preferências de cookies" }));
    const dialog = screen.getByRole("dialog", { name: "Preferências de cookies" });
    expect(within(dialog).getByRole("checkbox", { name: "Medição" })).toBeChecked();
    await user.click(within(dialog).getByRole("checkbox", { name: "Medição" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Anúncios" }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar escolhas" }));

    expect(consent.get().choices).toEqual({ analytics: false, marketing: false });
    expect(readConsentCommands(window.dataLayer ?? []).at(-1)?.state).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });

  it("sem ID de contêiner, aceitar não insere nenhum script", async () => {
    const user = userEvent.setup();
    renderProvider(null);

    await user.click(screen.getByRole("button", { name: "Aceitar" }));

    expect(document.querySelectorAll("script[src]")).toHaveLength(0);
  });

  it("registra um page_view por rota, sem repetir quando o componente renderiza de novo", async () => {
    const user = userEvent.setup();
    const view = renderProvider();
    await user.click(screen.getByRole("button", { name: "Aceitar" }));

    view.rerender(
      <MartechProvider gtmId={TEST_GTM_ID}>
        <p>Conteúdo da página</p>
      </MartechProvider>,
    );
    navigation.pathname = "/obrigado";
    view.rerender(
      <MartechProvider gtmId={TEST_GTM_ID}>
        <p>Outra página</p>
      </MartechProvider>,
    );

    expect(eventsNamed("page_view").map((entry) => entry.page_path)).toEqual(["/demo/lead", "/obrigado"]);
    expect(gtmScripts()).toHaveLength(1);
  });

  it("captura a campanha da URL de entrada e a leva nos eventos", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/demo/lead?utm_source=google&gclid=abc");
    renderProvider();

    await user.click(screen.getByRole("button", { name: "Aceitar" }));

    expect(eventsNamed("page_view")[0]).toMatchObject({ utm_source: "google", gclid: "abc" });
  });
});

describe("AttributionCapture", () => {
  it("guarda a campanha da rota de entrada sem mostrar aviso, sem dataLayer e sem tag", () => {
    window.history.replaceState(null, "", "/?utm_source=google&gclid=abc&email=a%40b.c");

    const { container } = render(<AttributionCapture />);

    expect(container).toBeEmptyDOMElement();
    expect(JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "{}")).toEqual({ gclid: "abc", utm_source: "google" });
    expect(window.dataLayer).toBeUndefined();
    expect(gtmScripts()).toHaveLength(0);
    expect(window.localStorage).toHaveLength(0);
  });
});

describe("hooks fora do provider", () => {
  function Orphan() {
    useTrack();
    return null;
  }

  it("falham com mensagem que diz o que falta", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<Orphan />)).toThrow("useTrack precisa estar dentro de <MartechProvider>.");
    expect(() => render(<ConsentPreferencesButton />)).toThrow("useOpenConsentPreferences precisa estar dentro de <MartechProvider>.");
    silence.mockRestore();
  });
});
