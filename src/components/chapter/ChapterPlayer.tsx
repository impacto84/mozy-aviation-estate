"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CHAPTER_COPY } from "@/lib/editorial";
import { CHAPTERS, findChapter, framePath } from "@/lib/chapters";
import type { ChapterId } from "@/lib/chapters";
import styles from "./ChapterPlayer.module.css";
import { useFrameScrub } from "./useFrameScrub";

/**
 * Capítulo cinematográfico da home: as sequências reais de frames viram um
 * capítulo interativo sob demanda. Três capítulos (aproximação, residência,
 * hangar); os quadros do capítulo ativo só são pedidos quando a seção se
 * aproxima da tela, em lote (quadros-chave primeiro).
 *
 * - Movimento permitido: trilho de rolagem com canvas fixo (sticky); o quadro
 *   segue a rolagem pelo ScrollTrigger, no mesmo relógio do Lenis.
 * - `prefers-reduced-motion: reduce`, sem JavaScript ou antes de hidratar:
 *   quadro estático nítido + todas as legendas visíveis, sem trilho alto (Piso P1).
 * - Nada por frame passa pelo React: legenda, contador e barra são escritos no DOM.
 */
export function ChapterPlayer() {
  const [activeId, setActiveId] = useState<ChapterId>("approach");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const chapter = findChapter(activeId);
  const copy = CHAPTER_COPY[activeId];
  const mode = useFrameScrub({ chapter, trackRef, canvasRef, hudRef });
  const chapterIndex = CHAPTERS.findIndex((entry) => entry.id === activeId) + 1;

  return (
    <section className={styles.section} aria-labelledby="capitulo-titulo" data-surface="void" data-chapter-mode={mode}>
      <div className={styles.intro}>
        <h2 id="capitulo-titulo" className={styles.heading}>
          Da aproximação ao hangar, em três capítulos.
        </h2>
        <p className={styles.note}>Sequências do projeto conceitual. Role para avançar quadro a quadro; com movimento reduzido, cada capítulo é um quadro fixo.</p>
      </div>
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <Image
            key={chapter.id}
            className={styles.still}
            src={framePath(chapter.dir, chapter.stillFrame)}
            alt={`${copy.label}: ${copy.arrival.title}`}
            width={chapter.width}
            height={chapter.height}
            sizes="100vw"
            quality={72}
          />
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <div className={styles.shade} aria-hidden="true" />
          <div ref={hudRef} className={styles.hud} data-phase="intro">
            <div className={styles.controls} role="group" aria-label="Escolher capítulo">
              {CHAPTERS.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  className={styles.tab}
                  aria-pressed={entry.id === activeId}
                  onClick={() => setActiveId(entry.id)}
                >
                  <span className={`${styles.tabIndex} tnum`}>0{index + 1}</span>
                  {CHAPTER_COPY[entry.id].label}
                </button>
              ))}
            </div>
            <div className={styles.captions} data-forja-allow-hidden="">
              <div className={styles.caption} data-caption="intro">
                <p className={styles.captionKicker}>{copy.intro.kicker}</p>
                <p className={styles.captionTitle}>{copy.intro.title}</p>
                <p className={styles.captionBody}>{copy.intro.body}</p>
              </div>
              <div className={styles.caption} data-caption="mid">
                <p className={styles.captionMid}>{copy.mid}</p>
              </div>
              <div className={styles.caption} data-caption="arrival">
                <p className={styles.captionKicker}>{copy.arrival.kicker}</p>
                <p className={styles.captionTitle}>{copy.arrival.title}</p>
                {copy.arrival.body === "" ? null : <p className={styles.captionBody}>{copy.arrival.body}</p>}
              </div>
            </div>
            <div className={styles.readout} aria-hidden="true">
              <span className="tnum">CAP {String(chapterIndex).padStart(2, "0")} · {copy.label.toUpperCase()}</span>
              <span className={styles.meter}>
                <span className={styles.meterFill} data-scrub-meter="" />
              </span>
              <span className="tnum" data-scrub-counter="">
                QDR —
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
