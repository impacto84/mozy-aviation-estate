import { Component } from "react";
import type { ReactNode } from "react";

export interface HeroErrorBoundaryProps {
  /** Recebe o erro para o hero cair no pôster e registrar o motivo. */
  readonly onError: (error: unknown) => void;
  readonly children: ReactNode;
}

interface HeroErrorBoundaryState {
  readonly hasError: boolean;
}

/**
 * Segura qualquer erro de render da cena (chunk que não baixou, three que não
 * conseguiu criar o renderer). A cena some e o pôster, que nunca saiu, aparece.
 * Error boundary ainda exige classe no React.
 */
export class HeroErrorBoundary extends Component<HeroErrorBoundaryProps, HeroErrorBoundaryState> {
  override state: HeroErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HeroErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    this.props.onError(error);
  }

  override render(): ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}
