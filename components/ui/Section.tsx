import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 py-16 md:py-24", className)}
    >
      <div className="mx-auto max-w-[1200px] px-5">
        {(eyebrow || title || intro) && (
          <div className="mx-auto max-w-2xl">
            {eyebrow && (
              <p className="mb-3 text-label-13-mono uppercase tracking-widest text-blue-700">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-balance text-heading-32 font-semibold text-gray-1000 md:text-heading-40">
                {title}
              </h2>
            )}
            {intro && (
              <div className="mt-4 text-pretty text-copy-16 text-gray-900">
                {intro}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
