import { describe, expect, it } from "vitest";
import { CONSENT_MODE_DENIED, CONSENT_MODE_SIGNALS, pushConsentCommand, readConsentCommands, toConsentMode } from "./consent-mode";

describe("toConsentMode", () => {
  it("nega os quatro sinais do Consent Mode v2 quando nada foi aceito", () => {
    expect(CONSENT_MODE_DENIED).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    expect(Object.keys(CONSENT_MODE_DENIED).sort()).toEqual([...CONSENT_MODE_SIGNALS].sort());
  });

  it("libera só a medição quando só analytics foi aceito", () => {
    expect(toConsentMode({ analytics: true, marketing: false })).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
  });

  it("libera os três sinais de anúncio quando marketing foi aceito", () => {
    expect(toConsentMode({ analytics: false, marketing: true })).toEqual({
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "denied",
    });
  });
});

describe("pushConsentCommand", () => {
  it("empurra o comando como objeto arguments, que é o que o GTM reconhece", () => {
    const layer: unknown[] = [];

    pushConsentCommand(layer, "default", CONSENT_MODE_DENIED);

    const entry = layer[0];
    expect(Array.isArray(entry)).toBe(false);
    expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
    expect(Array.from(entry as ArrayLike<unknown>)).toEqual(["consent", "default", CONSENT_MODE_DENIED]);
  });

  it("não compartilha o objeto de estado com o dataLayer", () => {
    const layer: unknown[] = [];

    pushConsentCommand(layer, "update", CONSENT_MODE_DENIED);

    expect(Array.from(layer[0] as ArrayLike<unknown>)[2]).not.toBe(CONSENT_MODE_DENIED);
  });
});

describe("readConsentCommands", () => {
  it("devolve só os comandos de consentimento, na ordem", () => {
    const layer: unknown[] = [{ event: "page_view" }, null, "texto", ["outro", "comando"]];
    pushConsentCommand(layer, "default", CONSENT_MODE_DENIED);
    pushConsentCommand(layer, "update", toConsentMode({ analytics: true, marketing: true }));

    const commands = readConsentCommands(layer);

    expect(commands.map((command) => command.action)).toEqual(["default", "update"]);
    expect(commands[1]?.state).toMatchObject({ analytics_storage: "granted", ad_storage: "granted" });
  });
});
