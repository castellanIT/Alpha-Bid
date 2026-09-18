import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function BrandMark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const dims =
    size === "lg" ? { w: 220, h: 220 } : size === "sm" ? { w: 56, h: 56 } : { w: 88, h: 88 };

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      <Image
        src="/alpha-logo.png"
        alt="Alpha Warriors"
        width={dims.w}
        height={dims.h}
        priority={size === "lg"}
        className="object-contain drop-shadow-[0_0_24px_rgba(225,6,0,0.45)]"
      />
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <BrandMark size="sm" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Alpha Warriors
          </p>
          <h1 className="font-display text-3xl text-white md:text-4xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
