import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MartechProvider } from "@/components/consent/MartechProvider";
import { TEST_GTM_ID, eventsNamed, installDialogStub, resetMartechBrowserState } from "@/components/consent/test-support";
import { JsonLd } from "@/components/seo/JsonLd";
import { consent } from "@/lib/martech/consent";
import { UUID_V4_PATTERN } from "@/lib/martech/event-id";
import { faqPageJsonLd } from "@/lib/martech/seo/json-ld";
import { ConversionLink } from "./ConversionLink";
import { LeadForm } from "./LeadForm";

vi.mock("next/navigation", () => ({
  usePathname: () => "/solicitar-acesso",
}));

const TRACE_ID = "trace-0001-abcdef";
const ENDPOINT = "/api/leads";
const ACCEPTED = { success: true, data: { accepted: true }, traceId: TRACE_ID };
const SUCCESS_MESSAGE = "Solicitação recebida. Entraremos em contato pelos dados informados.";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Erro RFC 7807 como a rota `/api/leads` devolve. */
function problemResponse(status: number, extra: Readonly<Record<string, unknown>> = {}): Response {
  const body = { type: "urn:mozy:problem:test", title: "Erro", status, detail: "Falhou.", instance: ENDPOINT, traceId: TRACE_ID, ...extra };
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/problem+json; charset=utf-8" } });
}

function mockFetch(response: () => Response | Promise<Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(response()));
}

function renderForm() {
  return render(
    <MartechProvider gtmId={TEST_GTM_ID}>
      <h2 id="titulo">Solicitar acesso ao Data Room</h2>
      <LeadForm formId="data-room" endpoint={ENDPOINT} labelledBy="titulo" fallbackErrorId="envio-nao-concluido" fallbackSuccessId="envio-recebido" />
      <ConversionLink href="https://example.com/formulario" ctaId="externo">
        Formulário externo
      </ConversionLink>
    </MartechProvider>,
  );
}

const nameField = (): HTMLElement => screen.getByRole("textbox", { name: /Nome completo/ });
const emailField = (): HTMLElement => screen.getByRole("textbox", { name: /^E-mail/ });
const profileField = (): HTMLElement => screen.getByRole("combobox", { name: /Perfil de interesse/ });

async function fillValid(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(nameField(), "Ana Souza");
  await user.type(emailField(), "ana@empresa.com.br");
  await user.selectOptions(profileField(), "Runway Signature");
}

function sentBody(fetchSpy: ReturnType<typeof mockFetch>): Readonly<Record<string, string>> {
  const init = fetchSpy.mock.calls[0]?.[1];
  return JSON.parse(typeof init?.body === "string" ? init.body : "{}") as Readonly<Record<string, string>>;
}

const submitButton = (): HTMLElement => screen.getByRole("button", { name: /Solicitar acesso ao Data Room|Enviando|Solicitação enviada/ });
const formStatus = (): string | null => screen.getByRole("form").getAttribute("data-lead-status");
/** Região `status` do formulário (o banner de consentimento tem a sua própria). */
const leadMessage = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-lead-message]");

beforeEach(() => {
  installDialogStub();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetMartechBrowserState();
});

describe("LeadForm: marcação", () => {
  it("tem nome acessível, campos com rótulo, obrigatórios marcados e autocomplete", () => {
    renderForm();

    const form = screen.getByRole("form", { name: "Solicitar acesso ao Data Room" });
    const email = emailField();
    expect(form).toHaveAttribute("data-forja-conversion-event", "generate_lead");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", ENDPOINT);
    expect(nameField()).toBeRequired();
    expect(profileField()).toBeRequired();
    expect(profileField()).toHaveAccessibleDescription(/Coleção residencial/);
    expect(email).toBeRequired();
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("textbox", { name: /Family office/ })).not.toBeRequired();
    expect(screen.getByRole("textbox", { name: /Telefone com DDI/ })).toHaveAttribute("type", "tel");
  });

  it("deixa o campo-isca fora do teclado e da árvore de acessibilidade", () => {
    renderForm();

    const trap = document.querySelector<HTMLInputElement>('input[name="website"]');
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole("textbox", { name: /Deixe este campo em branco/ })).toBeNull();
  });

  it("põe a campanha da URL de entrada em campos ocultos e no link do formulário externo", async () => {
    window.history.replaceState(null, "", "/solicitar-acesso?utm_source=google&utm_medium=cpc&gclid=abc&fbclid=fb1&ttclid=tt1&outro=x");
    renderForm();

    await waitFor(() => expect(document.querySelector('input[name="utm_source"]')).toHaveValue("google"));
    const hidden = [...document.querySelectorAll<HTMLInputElement>('form input[type="hidden"]')].map((input) => [input.name, input.value]);
    const link = new URL(screen.getByRole("link", { name: "Formulário externo" }).getAttribute("href") ?? "");
    expect(hidden).toEqual([
      ["fbclid", "fb1"],
      ["gclid", "abc"],
      ["ttclid", "tt1"],
      ["utm_medium", "cpc"],
      ["utm_source", "google"],
    ]);
    expect(Object.fromEntries(link.searchParams)).toEqual({ fbclid: "fb1", gclid: "abc", ttclid: "tt1", utm_medium: "cpc", utm_source: "google" });
    expect(link.origin + link.pathname).toBe("https://example.com/formulario");
  });
});

describe("LeadForm: validação", () => {
  it("envio vazio mostra o erro de cada campo obrigatório, foca o primeiro e não chama o servidor", async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetch(() => jsonResponse(200, ACCEPTED));
    renderForm();

    await user.click(submitButton());

    const name = nameField();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Erro: Informe seu nome, com pelo menos 2 letras.");
    expect(emailField()).toHaveAccessibleDescription("Erro: Informe seu e-mail.");
    expect(profileField()).toHaveAccessibleDescription(/Erro: Escolha o perfil/);
    expect(name).toHaveFocus();
    expect(screen.getByText("Revise os 3 campos destacados.")).toHaveAttribute("role", "status");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ao sair de um campo preenchido errado mostra o erro, e some assim que a pessoa volta a digitar", async () => {
    const user = userEvent.setup();
    renderForm();
    const email = emailField();

    await user.type(email, "ana@");
    await user.tab();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Revise o campo destacado.")).toBeInTheDocument();

    await user.type(email, "e");
    expect(email).toHaveAttribute("aria-invalid", "false");
    expect(email).not.toHaveAttribute("aria-describedby");
  });

  it("não acusa campo obrigatório vazio só porque a pessoa passou por ele", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(nameField());
    await user.tab();

    expect(nameField()).toHaveAttribute("aria-invalid", "false");
  });

  it("mostra os erros por campo devolvidos pelo servidor em 422 (RFC 7807)", async () => {
    const user = userEvent.setup();
    mockFetch(() => problemResponse(422, { errors: { email: "Este e-mail não pode ser usado." } }));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());

    const email = emailField();
    await waitFor(() => expect(email).toHaveAccessibleDescription("Erro: Este e-mail não pode ser usado."));
    expect(email).toHaveFocus();
    expect(formStatus()).toBe("idle");
  });
});

describe("LeadForm: envio e conversão", () => {
  it("envio aceito: confirma na página e registra um generate_lead com o mesmo event_id do pedido", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/solicitar-acesso?utm_source=google&gclid=abc");
    consent.acceptAll();
    const fetchSpy = mockFetch(() => jsonResponse(200, ACCEPTED));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());

    await waitFor(() => expect(formStatus()).toBe("success"));
    expect(leadMessage()).toHaveAttribute("role", "status");
    expect(leadMessage()).toHaveTextContent(SUCCESS_MESSAGE);
    expect(submitButton()).toHaveTextContent("Solicitação enviada");
    const body = sentBody(fetchSpy);
    const conversions = eventsNamed("generate_lead");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(ENDPOINT);
    expect(body).toMatchObject({ name: "Ana Souza", email: "ana@empresa.com.br", profile: "Runway Signature", utm_source: "google", gclid: "abc", website: "" });
    expect(body.event_id).toMatch(UUID_V4_PATTERN);
    expect(conversions).toEqual([expect.objectContaining({ event_id: body.event_id, form_id: "data-room", utm_source: "google", gclid: "abc" })]);
    expect(JSON.stringify(conversions)).not.toContain("ana@empresa.com.br");
  });

  it("sem decisão de consentimento o evento fica na fila e sai quando a pessoa aceita", async () => {
    const user = userEvent.setup();
    mockFetch(() => jsonResponse(200, ACCEPTED));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());
    await waitFor(() => expect(formStatus()).toBe("success"));
    expect(eventsNamed("generate_lead")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Aceitar" }));
    expect(eventsNamed("generate_lead")).toHaveLength(1);
  });

  it("com consentimento recusado o lead segue, mas nenhum evento é registrado", async () => {
    const user = userEvent.setup();
    consent.rejectAll();
    mockFetch(() => jsonResponse(200, ACCEPTED));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());

    await waitFor(() => expect(formStatus()).toBe("success"));
    expect(eventsNamed("generate_lead")).toHaveLength(0);
  });

  it("envio descartado pelo servidor (campo-isca) confirma na tela sem contar conversão", async () => {
    const user = userEvent.setup();
    consent.acceptAll();
    mockFetch(() => jsonResponse(200, { success: true, data: { accepted: false }, traceId: TRACE_ID }));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());

    await waitFor(() => expect(formStatus()).toBe("success"));
    expect(eventsNamed("generate_lead")).toHaveLength(0);
  });

  it("falha do servidor: mostra o erro anunciado com o traceId, não conta conversão, e a nova tentativa funciona", async () => {
    const user = userEvent.setup();
    consent.acceptAll();
    let status = 503;
    const fetchSpy = mockFetch(() => (status === 200 ? jsonResponse(200, ACCEPTED) : problemResponse(status)));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());
    await waitFor(() => expect(formStatus()).toBe("error"));
    expect(screen.getByText(/Não foi possível enviar agora/)).toHaveAttribute("role", "status");
    expect(leadMessage()).toHaveTextContent(`Código de rastreio: ${TRACE_ID}.`);
    expect(nameField()).toHaveValue("Ana Souza");
    expect(eventsNamed("generate_lead")).toHaveLength(0);

    status = 200;
    await user.click(submitButton());
    await waitFor(() => expect(formStatus()).toBe("success"));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(eventsNamed("generate_lead")).toHaveLength(1);
  });

  it("falha de rede e limite de tentativas têm mensagens próprias", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderForm();
    await fillValid(user);

    await user.click(submitButton());
    expect(await screen.findByText(/verifique sua conexão/)).toBeInTheDocument();

    fetchSpy.mockResolvedValueOnce(problemResponse(429));
    await user.click(submitButton());
    expect(await screen.findByText(/Muitas tentativas/)).toBeInTheDocument();
  });

  it("clique duplo durante o envio não manda o lead duas vezes nem conta duas conversões", async () => {
    const user = userEvent.setup();
    consent.acceptAll();
    let release: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockReturnValue(pending);
    renderForm();
    await fillValid(user);

    await user.click(submitButton());
    expect(submitButton()).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Enviando sua solicitação…")).toHaveAttribute("role", "status");
    await user.click(submitButton());
    release(jsonResponse(200, ACCEPTED));

    await waitFor(() => expect(formStatus()).toBe("success"));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(eventsNamed("generate_lead")).toHaveLength(1);
  });
});

describe("ConversionLink", () => {
  it("registra o clique como cta_click e mantém o href limpo quando não há campanha", async () => {
    const user = userEvent.setup();
    consent.acceptAll();
    renderForm();
    const link = screen.getByRole("link", { name: "Formulário externo" });
    link.addEventListener("click", (event) => event.preventDefault());

    await user.click(link);

    expect(link).toHaveAttribute("href", "https://example.com/formulario");
    expect(link).toHaveAttribute("data-forja-conversion");
    expect(eventsNamed("cta_click")).toEqual([expect.objectContaining({ cta_id: "externo" })]);
  });

  it("devolve o href como veio quando ele não é uma URL absoluta", () => {
    render(
      <MartechProvider gtmId={null}>
        <ConversionLink href="/contato" ctaId="interno">
          Contato
        </ConversionLink>
      </MartechProvider>,
    );

    expect(screen.getByRole("link", { name: "Contato" })).toHaveAttribute("href", "/contato");
  });
});

describe("JsonLd", () => {
  it("renderiza um script de dados estruturados que volta igual no parse", () => {
    const data = faqPageJsonLd([{ question: "Funciona sem cookies?", answer: "Sim, </script> incluso." }]);

    const { container } = render(<JsonLd data={data} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script?.textContent ?? "")).toEqual(data);
  });
});
