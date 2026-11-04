import type { ReactNode } from "react";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/", label: "HOME" },
  { href: "/layer", label: "LAYER SPEC v0.1" },
  { href: "/brick-break-design", label: "BRICK BREAK DESIGN" },
  { href: "/paper-airplane-design", label: "PAPER AIRPLANE DESIGN" },
  { href: "/soil-stack-design", label: "SOIL STACK DESIGN" },
  { href: "/local-energy-design", label: "LOCAL ENERGY DESIGN" },
  { href: "/repair-cafe-design", label: "REPAIR CAFE DESIGN" },
  { href: "/preventative-health-design", label: "PREVENTATIVE HEALTH DESIGN" },
  { href: "/bin-runner", label: "PLAY BIN RUNNER" },
  { href: "/brick-break", label: "PLAY BRICK BREAK" },
  { href: "/paper-airplane", label: "PLAY PAPER AIRPLANE" },
  { href: "/soil-stack", label: "PLAY SOIL STACK" },
  { href: "/local-energy", label: "PLAY KETTLE LANE" },
  { href: "/repair-cafe", label: "PLAY LEND & MEND" },
  { href: "/preventative-health", label: "PLAY TEND" },
];

export function DocShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-[#0a0f0a] px-4 py-6 text-lime-100">
      <nav className="mb-6 flex flex-wrap gap-2">
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="font-pixel text-[8px] text-lime-300 underline decoration-lime-500/40 hover:text-lime-100"
          >
            {n.label}
          </a>
        ))}
      </nav>
      <header className="mb-4 border-b border-lime-500/30 pb-3">
        <h1 className="font-pixel text-sm text-lime-300">{title}</h1>
        <p className="mt-2 text-[10px] text-lime-100/60">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}

export function RawDoc({ text }: { text: string }) {
  return (
    <pre className="max-h-[80vh] overflow-auto whitespace-pre-wrap border border-lime-500/20 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-lime-100/90">
      {text}
    </pre>
  );
}