import { contact, nav } from "@/lib/site-data";

export function SiteNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <a
          href="#topo"
          className="flex items-center rounded-md bg-void/80 px-2.5 py-1.5 backdrop-blur-md"
        >
          <img
            src="/media/logo-nav.png"
            alt="MOZY Construction Inc."
            className="h-8 w-auto md:h-9"
          />
        </a>
        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.18em] text-muted md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-gold">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={contact.phoneHref}
            className="hidden rounded-full border border-gold/50 px-4 py-2 text-xs tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-void sm:inline-flex"
          >
            {contact.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
