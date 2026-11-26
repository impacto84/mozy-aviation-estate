/**
 * Agendador de frames da página. Começa no `requestAnimationFrame` do navegador
 * e passa para o ticker do GSAP quando o motor de rolagem termina de carregar
 * (`ScrollProvider`). Não importa GSAP: fica no JS inicial sem pesar.
 */

import type { FrameScheduler } from "@/lib/motion/clock";
import { createSwitchableScheduler } from "@/lib/motion/switchable-scheduler";

export const browserScheduler: FrameScheduler = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
};

export const pageScheduler = createSwitchableScheduler(browserScheduler);
