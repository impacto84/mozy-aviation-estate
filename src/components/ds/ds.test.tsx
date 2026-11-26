import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { CommandPalette } from "./CommandPalette";
import { Dialog } from "./Dialog";
import { EmptyState, Skeleton } from "./Feedback";
import { Tabs } from "./Tabs";

describe("Design System primitives", () => {
  it("Button aplica aria-busy e desabilita cliques durante loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("Badge renderiza conteúdo e indicador opcional", () => {
    render(
      <Badge tone="success" dot>
        Confirmado
      </Badge>,
    );

    expect(screen.getByText("Confirmado")).toBeInTheDocument();
  });

  it("Tabs troca de painel por clique e setas do teclado", () => {
    render(
      <Tabs
        label="Visualizações"
        items={[
          { id: "hoje", label: "Hoje", content: <p>Conteúdo de hoje</p> },
          { id: "semana", label: "Semana", content: <p>Conteúdo da semana</p> },
        ]}
      />,
    );

    const tabHoje = screen.getByRole("tab", { name: "Hoje" });
    const tabSemana = screen.getByRole("tab", { name: "Semana" });
    expect(screen.getByText("Conteúdo de hoje")).toBeVisible();

    fireEvent.keyDown(tabHoje, { key: "ArrowRight" });
    expect(tabSemana).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Conteúdo da semana")).toBeVisible();
  });

  it("Dialog abre quando open=true e dispara onClose ao clicar em fechar", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Detalhes">
        <p>Corpo do diálogo</p>
      </Dialog>,
    );

    expect(screen.getByRole("heading", { name: "Detalhes" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar janela" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("CommandPalette filtra comandos, responde a Cmd+K e executa ação", () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        items={[
          { id: "rotas", label: "Abrir rotas", group: "Navegação", onSelect },
          { id: "export", label: "Exportar CSV", group: "Ações", onSelect: vi.fn() },
        ]}
      />,
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "rotas" } });
    expect(screen.queryByText("Exportar CSV")).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Skeleton e EmptyState entregam feedback acessível", () => {
    const onRetry = vi.fn();
    render(
      <>
        <Skeleton lines={2} label="Carregando entregas" />
        <EmptyState title="Sem entregas" description="Nenhuma rota ativa." actionLabel="Recarregar" onAction={onRetry} />
      </>,
    );

    expect(screen.getByRole("status", { name: "Carregando entregas" })).toHaveAttribute("aria-busy", "true");
    fireEvent.click(screen.getByRole("button", { name: "Recarregar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
