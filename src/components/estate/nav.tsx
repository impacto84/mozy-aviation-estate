import { contact, nav } from "@/lib/site-data";

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-void/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.5rem] md:px-8">
        <a href="#topo" className="flex min-w-0 shrink-0 items-center gap-3">
          <img
            src="/media/logo-mark.png"
            alt=""
            className="h-9 w-auto md:h-10"
          />
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] tracking-[0.06em] text-fg md:text-[1.55rem]">
              MOZY
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.22em] text-gold">
              Construction Inc.
            </span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-fg/80 lg:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-gold">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={contact.phoneHref}
          className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-gold px-4 py-2 text-xs font-medium tracking-wide text-void transition-colors hover:bg-gold-soft"
        >
          {contact.phone}
        </a>
      </div>
    </header>
  );
}
