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
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

    let dest = { dx: 0, dy: 0, dw: 0, dh: 0 };
    let disposed = false;
    const inflight = new Set<number>();

    function computeRect() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
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
      ctx.clearRect(0, 0, canvas!.clientWidth, canvas!.clientHeight);
      ctx.drawImage(img, dest.dx, dest.dy, dest.dw, dest.dh);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
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
      img.onerror = () => inflight.delete(index);
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
          <p className="font-display text-base tracking-wide text-fg/80">Preparando a aproximação</p>
          <div className="h-0.5 w-40 overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/3 animate-pulse bg-gold" />
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/50 via-transparent to-void/70" />

        <div
          ref={introRef}
          className="relative z-10 flex h-full flex-col justify-center px-5 md:px-12 lg:px-16"
        >
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.32em] text-gold">{intro.kicker}</p>
            <h1 className="font-display mt-6 text-4xl leading-[1.05] sm:text-6xl md:text-7xl">{intro.title}</h1>
            {intro.body ? (
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">{intro.body}</p>
            ) : null}
          </div>
        </div>

        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-[0.22em] text-gold-soft">Role para avançar</span>
          <span className="block h-8 w-px bg-gold/50" />
        </div>

        {mid ? (
          <div
            ref={midRef}
            className="pointer-events-none absolute inset-x-0 bottom-14 z-10 flex justify-center"
            style={{ opacity: 0 }}
          >
            <span className="rounded-full border border-border bg-void/70 px-4 py-2 text-xs uppercase tracking-[0.28em] text-fg backdrop-blur-md">
              {mid}
            </span>
          </div>
        ) : null}

        <div
          ref={arrivalRef}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end px-6 pb-20 text-center"
          style={{ opacity: 0 }}
        >
          <p className="text-xs uppercase tracking-[0.32em] text-gold">{arrival.kicker}</p>
          <h2 className="font-display mt-4 max-w-3xl text-3xl leading-tight md:text-6xl">{arrival.title}</h2>
          {arrival.body ? <p className="mt-4 max-w-lg text-muted">{arrival.body}</p> : null}
        </div>
      </section>
    </div>
  );
}
