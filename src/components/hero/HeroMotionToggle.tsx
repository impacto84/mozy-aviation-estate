import styles from "./HeroStage.module.css";

export interface HeroMotionToggleProps {
  readonly isPlaying: boolean;
  readonly onToggle: () => void;
}

const PAUSE_LABEL = "Pausar animação de fundo";
const PLAY_LABEL = "Retomar animação de fundo";

/**
 * Controle de pausa do fundo animado. O rótulo muda com o estado, por isso não
 * leva `aria-pressed` (um leitor de tela anunciaria "Retomar, pressionado").
 */
export function HeroMotionToggle({ isPlaying, onToggle }: HeroMotionToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={isPlaying ? PAUSE_LABEL : PLAY_LABEL}
      data-hero-toggle=""
      onClick={onToggle}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        {isPlaying ? <path d="M3 2h4v12H3zM9 2h4v12H9z" /> : <path d="M4 2l10 6-10 6z" />}
      </svg>
    </button>
  );
}
