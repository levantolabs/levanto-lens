import LevantoLogo from "@/components/LevantoLogo";

/** Minimal standalone header: wordmark, the demo's name, a link back to levanto.ai. */
export default function Nav() {
  return (
    <header className="shrink-0 border-b border-hair bg-paper text-blue">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <a href="https://levanto.ai" className="flex shrink-0 items-baseline gap-2.5" aria-label="Levanto">
          <LevantoLogo className="h-[20px] w-auto sm:h-[24px]" />
          <span className="tag hidden sm:inline">Lens</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="https://levanto-gallery.vercel.app/lens" className="pill shrink-0 !px-3">Gallery</a>
          <a href="https://docs.levanto.ai" target="_blank" rel="noopener noreferrer" className="pill shrink-0 !px-3">Docs ↗</a>
        </div>
      </nav>
    </header>
  );
}
