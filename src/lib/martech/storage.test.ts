import { describe, expect, it } from "vitest";
import { createMemoryStorage, readStorage, resolveBrowserStorage, writeStorage } from "./storage";
import type { KeyValueStorage } from "./storage";

function throwingStorage(): KeyValueStorage {
  const fail = (): never => {
    throw new Error("acesso negado");
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

describe("createMemoryStorage", () => {
  it("guarda, lê e remove valores sem tocar no navegador", () => {
    const storage = createMemoryStorage({ a: "1" });

    storage.setItem("b", "2");
    storage.removeItem("a");

    expect(storage.getItem("a")).toBeNull();
    expect(storage.getItem("b")).toBe("2");
  });
});

describe("resolveBrowserStorage", () => {
  it("devolve o localStorage ou o sessionStorage do host", () => {
    expect(resolveBrowserStorage("local", window)).toBe(window.localStorage);
    expect(resolveBrowserStorage("session", window)).toBe(window.sessionStorage);
  });

  it("devolve null fora do navegador e quando o host não tem storage", () => {
    expect(resolveBrowserStorage("local", undefined)).toBeNull();
    expect(resolveBrowserStorage("session", {})).toBeNull();
  });

  it("devolve null quando o navegador nega o acesso ao storage", () => {
    const denied = {
      get localStorage(): Storage {
        throw new Error("SecurityError");
      },
    };

    expect(resolveBrowserStorage("local", denied)).toBeNull();
  });
});

describe("readStorage e writeStorage", () => {
  it("leem e gravam em um storage que funciona", () => {
    const storage = createMemoryStorage();

    expect(writeStorage(storage, "k", "v")).toBe(true);
    expect(readStorage(storage, "k")).toBe("v");
    expect(writeStorage(storage, "k", null)).toBe(true);
    expect(readStorage(storage, "k")).toBeNull();
  });

  it("não deixam a exceção do navegador escapar", () => {
    expect(readStorage(throwingStorage(), "k")).toBeNull();
    expect(writeStorage(throwingStorage(), "k", "v")).toBe(false);
  });

  it("tratam storage ausente como leitura vazia e escrita recusada", () => {
    expect(readStorage(null, "k")).toBeNull();
    expect(writeStorage(null, "k", "v")).toBe(false);
  });
});
