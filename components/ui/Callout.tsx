import { cn } from "@/lib/cn";
import { Info, Lightbulb, TriangleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "info" | "tip" | "warning" | "success";

const config: Record<
  Variant,
  { icon: typeof Info; border: string; bg: string; text: string }
> = {
  info: {
    icon: Info,
    border: "border-blue-600/30",
    bg: "bg-blue-600/[0.06]",
    text: "text-blue-700",
  },
  tip: {
    icon: Lightbulb,
    border: "border-purple-700/30",
    bg: "bg-purple-700/[0.06]",
    text: "text-purple-900",
  },
  warning: {
    icon: TriangleAlert,
    border: "border-amber-600/30",
    bg: "bg-amber-600/[0.06]",
    text: "text-amber-700",
  },
  success: {
    icon: CircleCheck,
    border: "border-green-600/30",
    bg: "bg-green-600/[0.06]",
    text: "text-green-700",
  },
};

interface CalloutProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Callout({
  variant = "info",
  title,
  children,
  className,
}: CalloutProps) {
  const { icon: Icon, border, bg, text } = config[variant];
  return (
    <div
      className={cn(
        "my-5 flex gap-3 rounded-lg border p-4",
        border,
        bg,
        className,
      )}
    >
      <Icon size={18} className={cn("mt-0.5 shrink-0", text)} />
      <div className="min-w-0 space-y-1">
        {title && (
          <p className={cn("text-label-14 font-medium", text)}>{title}</p>
        )}
        <div className="text-copy-14 text-gray-900 [&_a]:text-blue-700 [&_a]:underline [&_code]:font-mono [&_code]:text-gray-1000">
          {children}
        </div>
      </div>
    </div>
  );
}
