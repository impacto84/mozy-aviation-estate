import { useEffect, useRef, useState } from "react";
import { lands } from "@/lib/site-data";
import { cn } from "@/lib/utils";

type SiteId = "overview" | "honey" | "peace" | "osceola";

export function SatelliteAtlas() {
  const [active, setActive] = useState<SiteId>("overview");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    lands.forEach((land) => {
      const el = cardRefs.current[land.id];
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(land.id as SiteId);
        },
        { threshold: 0.55, rootMargin: "-20% 0px -30% 0px" },
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const site = lands.find((l) => l.id === active);

  return (
    <div className="mt-12">
      <div className="relative h-[58vh] min-h-80 overflow-hidden border border-line bg-void md:h-[72vh]">
        <div
          className="absolute inset-0 origin-center transition-transform duration-1000 ease-out"
          style={{
            transformOrigin: site ? `${site.ox} ${site.oy}` : "52% 38%",
            transform: site ? "scale(4.4)" : "scale(1.04)",
          }}
        >
          <img
            src="/media/sat/overview-marked.jpg"
            alt="Satélite real da Flórida Central com os três terrenos"
            className="h-full w-full object-cover"
          />
        </div>

        {lands.map((land) => (
          <img
            key={land.id}
            src={land.sat}
            alt={`Satélite ${land.name}`}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              active === land.id ? "opacity-100" : "opacity-0",
            )}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30" />

        <div className="absolute left-4 top-4 z-10 border border-line bg-void/85 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-brass backdrop-blur-md">
          {site ? site.name : "Flórida Central · satélite real"}
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive("overview")}
            className={cn(
              "border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors",
              active === "overview"
                ? "border-brass bg-brass text-void"
                : "border-line bg-void/70 text-fog hover:text-brass",
            )}
          >
            Orlando
          </button>
          {lands.map((land) => (
            <button
              type="button"
              key={land.id}
              onClick={() => setActive(land.id as SiteId)}
              className={cn(
                "border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors",
                active === land.id
                  ? "border-brass bg-brass text-void"
                  : "border-line bg-void/70 text-fog hover:text-brass",
              )}
            >
              {land.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-0 border-t border-line lg:grid-cols-3">
        {lands.map((land) => (
          <article
            key={land.id}
            ref={(el) => {
              cardRefs.current[land.id] = el;
            }}
            onMouseEnter={() => setActive(land.id as SiteId)}
            className={cn(
              "overflow-hidden border-b border-line transition-colors lg:border-b-0 lg:border-r lg:last:border-r-0",
              active === land.id ? "bg-panel/40" : "bg-transparent",
            )}
          >
            <div className="relative h-52">
              <img src={land.photo} alt={`Anúncio ${land.name}`} className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 h-2.5 w-2.5 bg-mark ring-4 ring-mark/25" />
            </div>
            <div className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-brass">{land.priority}</p>
              <h3 className="mt-2 text-xl tracking-tight">{land.name}</h3>
              <p className="text-sm text-fog">{land.place}</p>
              <p className="mt-4 text-lg">{land.acres}</p>
              <p className="text-brass-soft">{land.price}</p>
              <p className="mt-4 text-sm text-fog">{land.zoning}</p>
              <p className="text-sm text-fog">{land.access}</p>
              <p className="mt-3 text-sm text-fog">{land.extra}</p>
              <p className="mt-4 text-sm">Força: {land.strength}</p>
              <p className="text-sm text-fog">Risco: {land.risk}</p>
              <p className="mt-3 text-sm">{land.test}</p>
              <p className="mt-3 text-xs text-fog">{land.note}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
