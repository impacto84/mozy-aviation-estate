"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { findChapter, frameCounter } from "@/lib/chapters";
import type { ChapterId } from "@/lib/chapters";
import styles from "./CinematicAct.module.css";
import { useFrameScrub } from "./useFrameScrub";

export interface ActCaption {
  readonly kicker: string;
  readonly title: string;
  readonly body?: string;
}

interface CinematicActProps {
  readonly chapterId: ChapterId;
  /** Numeral do ato no HUD (I, II, III). */
  readonly numeral: string;
  /** Rótulo curto do ato no HUD. */
  readonly label: string;
  /** Id do título da seção (`aria-labelledby`). */
  readonly headingId: string;
  /** Pôster renderizado no servidor (o que se vê sem JS, antes dos quadros e com movimento reduzido). */
  readonly poster: ReactNode;
  /** Abertura do ato. No Ato I é o hero (h1 + CTA); nos demais, a legenda de entrada com o h2. */
  readonly opening: ReactNode;
  readonly mid: string;
  readonly arrival: ActCaption;
  /** Telemetria discreta no rodapé do palco (opcional). */
  readonly telemetry?: ReactNode;
  /** Âncora da seção (sumário da página). */
  readonly sectionId?: string;
}

/**
 * Ato cinematográfico em tela cheia: trilha alta (360–560svh) com palco sticky de
 * 100svh, pôster SSR e canvas 2D que segue a rolagem quadro a quadro.
 *
 * - Movimento permitido: a trilha e o sticky vêm do CSS (sem salto depois da
 *   hidratação); o canvas cobre o pôster quando o primeiro quadro decodifica.
 * - `prefers-reduced-motion: reduce`: trilha compacta, quadro parado e todas as
 *   legendas visíveis abaixo do palco (Piso P1). Nenhum quadro é baixado.
 * - Nada por quadro passa pelo React: fase da legenda, contador e barra vivem no DOM.
 */
export function CinematicAct({ chapterId, numeral, label, headingId, poster, opening, mid, arrival, telemetry, sectionId }: CinematicActProps) {
  const chapter = findChapter(chapterId);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mode = useFrameScrub({ chapter, trackRef, canvasRef, stageRef });

  return (
    <section id={sectionId} className={styles.act} aria-labelledby={headingId} data-act={chapterId} data-act-mode={mode} data-forja-scene={`act-${chapterId}`} data-surface="void">
      <div ref={trackRef} className={styles.track}>
        <div ref={stageRef} className={styles.stage} data-phase="intro">
          <div className={styles.poster}>{poster}</div>
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" data-act-canvas={chapterId} />
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.frameLines} aria-hidden="true" />

          <div className={styles.opening}>{opening}</div>

          <div className={styles.captions} data-forja-allow-hidden="">
            <p className={styles.mid} data-caption="mid">
              {mid}
            </p>
            <div className={styles.arrival} data-caption="arrival">
              <p className={styles.kicker}>{arrival.kicker}</p>
              <p className={styles.arrivalTitle}>{arrival.title}</p>
              {arrival.body === undefined || arrival.body === "" ? null : <p className={styles.body}>{arrival.body}</p>}
            </div>
          </div>

          <div className={styles.readout} aria-hidden="true">
            <span className={`${styles.readoutLabel} tnum`}>
              ATO {numeral} · {label.toUpperCase()}
            </span>
            <span className={styles.meter}>
              <span className={styles.meterFill} />
            </span>
            <span className={`${styles.counter} tnum`} data-scrub-counter="">
              {frameCounter(chapter.stillFrame, chapter.count)}
            </span>
          </div>
          {telemetry === undefined ? null : <div className={styles.telemetry}>{telemetry}</div>}
        </div>
      </div>

      <div className={styles.reducedCaptions}>
        <p className={styles.reducedMid}>{mid}</p>
        <div>
          <p className={styles.kicker}>{arrival.kicker}</p>
          <p className={styles.reducedTitle}>{arrival.title}</p>
          {arrival.body === undefined || arrival.body === "" ? null : <p className={styles.body}>{arrival.body}</p>}
        </div>
      </div>
    </section>
  );
}
