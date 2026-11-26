/**
 * Vidro sem custo fora da tela.
 *
 * `backdrop-filter` obriga o navegador a manter uma superfície de composição
 * para a camada. Enquanto a camada está longe da viewport, este módulo marca
 * `data-glass-idle="true"` e o CSS troca o filtro por `none`.
 *
 * O vidro nasce ligado: sem JavaScript, sem `IntersectionObserver` ou antes da
 * primeira resposta do observer, nada é marcado. Por isso não reutiliza
 * `watchVisibility` de `lib/motion`, que considera o alvo fora da tela até o
 * observer responder (certo para pausar animação, errado aqui: o vidro piscaria
 * sem blur logo depois da hidratação).
 *
 * Não usa `content-visibility: auto`: ele muda a altura do bloco quando sai da
 * tela e desalinha qualquer medida de rolagem (ScrollTrigger, âncoras).
 */

export const GLASS_IDLE_ATTRIBUTE = "data-glass-idle";

/** Um quarto de viewport acima e abaixo: o filtro religa antes de a camada aparecer. */
export const GLASS_VISIBILITY_MARGIN = "25% 0px";

const IDLE_VALUE = "true";

/**
 * Liga e desliga a marca de ociosidade da camada. Chame dentro de um efeito e
 * devolva a limpeza.
 */
export function watchGlassVisibility(layer: HTMLElement): () => void {
  if (typeof IntersectionObserver !== "function") {
    return () => undefined;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const latest = entries.at(-1);
      if (latest === undefined) {
        return;
      }
      if (latest.isIntersecting) {
        layer.removeAttribute(GLASS_IDLE_ATTRIBUTE);
      } else {
        layer.setAttribute(GLASS_IDLE_ATTRIBUTE, IDLE_VALUE);
      }
    },
    { rootMargin: GLASS_VISIBILITY_MARGIN },
  );
  observer.observe(layer);
  return () => {
    observer.disconnect();
    layer.removeAttribute(GLASS_IDLE_ATTRIBUTE);
  };
}
