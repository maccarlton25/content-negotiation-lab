import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "purple" | "teal";

const tones: Record<Tone, string> = {
  neutral: "border-gray-400 bg-background-300 text-gray-700",
  blue: "border-blue-600/30 bg-blue-600/10 text-blue-700",
  green: "border-green-600/30 bg-green-600/10 text-green-700",
  amber: "border-amber-600/30 bg-amber-600/10 text-amber-700",
  red: "border-red-600/30 bg-red-600/10 text-red-700",
  purple: "border-purple-700/30 bg-purple-700/10 text-purple-900",
  teal: "border-teal-700/30 bg-teal-700/10 text-teal-900",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  mono?: boolean;
}

export function Badge({ tone = "neutral", mono, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
        mono ? "text-label-12-mono" : "text-label-12 font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
