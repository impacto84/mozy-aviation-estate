import { contact, nav } from "@/lib/site-data";

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="absolute inset-0 bg-gradient-to-b from-void/90 via-void/55 to-transparent" />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-[4.75rem] md:px-8">
        <a href="#topo" className="group flex min-w-0 shrink-0 items-end gap-3">
          <span className="font-display text-[1.55rem] leading-none tracking-[0.08em] text-paper md:text-[1.75rem]">
            MOZY
          </span>
          <span className="mb-0.5 hidden text-[9px] uppercase tracking-[0.28em] text-brass sm:block">
            Aviation Estate
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-[11px] uppercase tracking-[0.22em] text-paper/70 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors duration-200 hover:text-brass"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={contact.phoneHref}
          className="cta-primary inline-flex shrink-0 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-[0.08em]"
        >
          {contact.phone}
        </a>
      </div>
    </header>
  );
}
