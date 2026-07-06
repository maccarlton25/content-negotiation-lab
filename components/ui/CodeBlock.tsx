"use client";

import { cn } from "@/lib/cn";
import { highlightLines } from "@/lib/highlight";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";

interface CodeBlockProps {
  code: string;
  filename?: string;
  highlight?: number[];
  lineNumbers?: boolean;
  className?: string;
  noCopy?: boolean;
}

export function CodeBlock({
  code,
  filename,
  highlight = [],
  lineNumbers = false,
  className,
  noCopy = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => highlightLines(code), [code]);
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);

  function copy() {
    navigator.clipboard.writeText(code.replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className={cn(
        "group/code overflow-hidden rounded-lg border border-gray-400 bg-background-code",
        className,
      )}
    >
      {(filename || !noCopy) && (
        <div className="flex items-center justify-between border-b border-gray-400 bg-background-200 px-3 py-1.5">
          <span className="text-label-12-mono text-gray-700">
            {filename ?? ""}
          </span>
          {!noCopy && (
            <button
              onClick={copy}
              className="flex items-center gap-1 rounded px-1.5 py-1 text-label-12 text-gray-700 transition-colors hover:text-gray-1000"
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-green-700" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className="py-3 text-copy-14-mono leading-[1.65]">
          <code className="block min-w-fit">
            {lines.map((line, idx) => {
              const n = idx + 1;
              const hot = highlightSet.has(n);
              return (
                <span
                  key={idx}
                  className={cn(
                    "flex px-4",
                    hot &&
                      "bg-blue-600/[0.08] shadow-[inset_2px_0_0_0_var(--color-blue-600)]",
                  )}
                >
                  {lineNumbers && (
                    <span className="mr-4 inline-block w-6 shrink-0 select-none text-right text-gray-600">
                      {n}
                    </span>
                  )}
                  <span className="whitespace-pre">{line}</span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
