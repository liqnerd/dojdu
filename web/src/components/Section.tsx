import { ReactNode } from "react";

export default function Section({ title, subtitle, children, cta }: {
  title: string;
  subtitle?: string;
  cta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {cta}
      </div>
      {children}
    </section>
  );
}


