import { useEffect, useRef, useState } from "react";

type Copy = {
  kicker: string;
  title: string;
  body?: string;
};

function ramp(x: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function bump(x: number, center: number, width: number) {
  const t = Math.abs(x - center) / width;
  return t >= 1 ? 0 : 1 - t * t * (3 - 2 * t);
}

function frameSrc(dir: string, i: number) {
  return `${dir}/frame-${String(i).padStart(4, "0")}.webp`;
}

export function Scrollymation({
  id,
  dir,
  count,
  heightVh = 360,
  intro,
  mid,
  arrival,
  midAt = 0.52,
}: {
  id: string;
  dir: string;
  count: number;
  heightVh?: number;
  intro: Copy;
  mid?: string;
  arrival: Copy;
  midAt?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const arrivalRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(Array(count).fill(null));
  const drawnRef = useRef(-1);
  const tickingRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const section = sectionRef.current;
    const canvasEl = canvasRef.current;
    if (!section || !canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

    let dest = { dx: 0, dy: 0, dw: 0, dh: 0 };
    let disposed = false;
    const inflight = new Set<number>();

    function computeRect() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const img = imagesRef.current.find((i) => i?.naturalWidth);
      const ir = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 16 / 9;
      const cr = w / h;
      if (cr > ir) dest = { dw: w, dh: w / ir, dx: 0, dy: (h - w / ir) / 2 };
      else dest = { dh: h, dw: h * ir, dy: 0, dx: (w - h * ir) / 2 };
    }

    function nearest(index: number) {
      const imgs = imagesRef.current;
      if (imgs[index]?.naturalWidth) return index;
      for (let d = 1; d < count; d++) {
        const a = index - d;
        const b = index + d;
        if (a >= 0 && imgs[a]?.naturalWidth) return a;
        if (b < count && imgs[b]?.naturalWidth) return b;
      }
      return 0;
    }

    function draw(index: number) {
      const img = imagesRef.current[nearest(index)];
      if (!img || !img.naturalWidth) return;
      drawnRef.current = index;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.drawImage(img, dest.dx, dest.dy, dest.dw, dest.dh);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";
      computeRect();
      draw(Math.max(0, drawnRef.current));
    }

    function loadOne(index: number) {
      if (disposed || imagesRef.current[index] || inflight.has(index)) return;
      inflight.add(index);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        inflight.delete(index);
        if (disposed) return;
        imagesRef.current[index] = img;
        if (index === 0) {
          resize();
          draw(0);
          setReady(true);
        } else if (index === drawnRef.current) {
          draw(index);
        }
      };
      img.onerror = () => {
        inflight.delete(index);
        // If the opening frame is unavailable, keep the page readable instead of
        // leaving the full-screen loading curtain up forever.
        if (!disposed && index === 0) setReady(true);
      };
      img.src = frameSrc(dir, index + 1);
    }

    function prefetchAround(center: number) {
      loadOne(center);
      for (let d = 1; d <= 10; d++) {
        if (center - d >= 0) loadOne(center - d);
        if (center + d < count) loadOne(center + d);
      }
    }

    function loadKeyframes() {
      for (let i = 0; i < count; i += 6) loadOne(i);
      loadOne(count - 1);
    }

    function syncText(progress: number) {
      if (introRef.current) {
        const fade = 1 - Math.min(1, progress / 0.08);
        introRef.current.style.opacity = String(fade);
        introRef.current.style.transform = `translateY(${(1 - fade) * -24}px)`;
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(1 - Math.min(1, progress / 0.04));
      }
      if (midRef.current) {
        midRef.current.style.opacity = String(bump(progress, midAt, 0.06));
      }
      if (arrivalRef.current) {
        arrivalRef.current.style.opacity = String(ramp(progress, 0.86, 1));
      }
    }

    function update() {
      tickingRef.current = false;
      const rect = section!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const frame = Math.min(count - 1, Math.round(progress * (count - 1)));
      prefetchAround(frame);
      if (frame !== drawnRef.current) draw(frame);
      syncText(progress);
    }

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(update);
    }

    loadOne(0);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        prefetchAround(0);
        loadKeyframes();
        io.disconnect();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(section);

    if (reduce) syncText(0);

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [count, dir, midAt]);

  return (
    <div ref={sectionRef} id={id} className="relative w-full" style={{ height: `${heightVh}vh` }}>
      <section className="sticky top-0 h-svh w-full overflow-hidden bg-void">
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-void transition-opacity duration-700"
          style={{ opacity: ready ? 0 : 1, pointerEvents: ready ? "none" : "auto" }}
        >
          <p className="font-display text-sm tracking-[0.18em] text-paper/70">
            PREPARANDO A APROXIMAÇÃO
          </p>
          <div className="h-px w-36 overflow-hidden bg-line">
            <div className="h-full w-1/3 animate-pulse bg-brass" />
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/55 via-transparent to-void/75" />

        <div
          ref={introRef}
          className="relative z-10 flex h-full flex-col justify-end px-5 pb-24 md:px-12 md:pb-28 lg:px-16"
        >
          <div className="max-w-2xl">
            <p className="section-kicker">{intro.kicker}</p>
            <h2 className="font-display mt-5 text-3xl leading-[1.05] text-paper sm:text-5xl md:text-6xl">
              {intro.title}
            </h2>
            {intro.body ? (
              <p className="mt-5 max-w-lg text-base leading-relaxed text-fog md:text-lg">
                {intro.body}
              </p>
            ) : null}
          </div>
        </div>

        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.28em] text-brass-soft">
            Role para avançar
          </span>
          <span className="block h-10 w-px bg-brass/40" />
        </div>

        {mid ? (
          <div
            ref={midRef}
            className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center"
            style={{ opacity: 0 }}
          >
            <span className="border-b border-brass/50 pb-1 text-[11px] uppercase tracking-[0.32em] text-paper">
              {mid}
            </span>
          </div>
        ) : null}

        <div
          ref={arrivalRef}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-start justify-end px-5 pb-24 md:px-12 md:pb-28 lg:px-16"
          style={{ opacity: 0 }}
        >
          <p className="section-kicker">{arrival.kicker}</p>
          <h2 className="font-display mt-4 max-w-3xl text-3xl leading-tight text-paper md:text-5xl">
            {arrival.title}
          </h2>
          {arrival.body ? (
            <p className="mt-4 max-w-lg text-fog">{arrival.body}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
