"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/**
 * Lets users try different Accept header values against a URL and see
 * what the server returns. Demonstrates that the rewrite matches
 * text/markdown anywhere in the Accept header.
 */

type Result = {
  accept: string;
  status: number;
  contentType: string | null;
  bodyPreview: string;
  bytes: number;
  isMarkdown: boolean;
};

const PRESETS: { label: string; accept: string; expect: "markdown" | "html" }[] = [
  { label: "text/markdown", accept: "text/markdown", expect: "markdown" },
  { label: "text/markdown, text/html", accept: "text/markdown, text/html", expect: "markdown" },
  { label: "text/html, text/markdown", accept: "text/html, text/markdown", expect: "markdown" },
  { label: "text/markdown;q=0.8, text/html;q=0.9", accept: "text/markdown;q=0.8, text/html;q=0.9", expect: "markdown" },
  { label: "text/html", accept: "text/html", expect: "html" },
  { label: "*/*", accept: "*/*", expect: "html" },
  { label: "(no header)", accept: "", expect: "html" },
];

export function AcceptHeaderTester({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);

  const testAll = useCallback(async () => {
    setBusy(true);
    const newResults: Result[] = [];

    for (const preset of PRESETS) {
      try {
        const headers: Record<string, string> = {};
        if (preset.accept) {
          headers.accept = preset.accept;
        }
        const res = await fetch(path, { cache: "no-store", headers });
        const body = await res.text();
        const contentType = res.headers.get("content-type");
        const isMarkdown = contentType?.includes("text/markdown") ?? false;
        newResults.push({
          accept: preset.accept || "(none)",
          status: res.status,
          contentType,
          bodyPreview: body.slice(0, 120).replace(/\n/g, " "),
          bytes: new TextEncoder().encode(body).length,
          isMarkdown,
        });
      } catch {
        newResults.push({
          accept: preset.accept || "(none)",
          status: 0,
          contentType: null,
          bodyPreview: "fetch error",
          bytes: 0,
          isMarkdown: false,
        });
      }
    }

    setResults(newResults);
    setBusy(false);
  }, [path]);

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-400 bg-background-200 p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-label-13-mono text-gray-700">
          testing <span className="text-gray-1000">{path}</span>
        </span>
        <Button size="sm" variant="secondary" onClick={testAll} disabled={busy}>
          {busy ? "Testing..." : "Test all headers"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-label-13-mono">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 pr-4 font-normal">Accept header</th>
                <th className="py-1 pr-4 font-normal">Response</th>
                <th className="py-1 pr-4 font-normal">Content-Type</th>
                <th className="py-1 pr-4 font-normal">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t border-gray-400/60">
                  <td className="py-1.5 pr-4">
                    <code className={r.isMarkdown ? "text-blue-700" : "text-amber-700"}>
                      {r.accept}
                    </code>
                  </td>
                  <td className="py-1.5 pr-4">
                    {r.isMarkdown ? (
                      <Badge tone="blue" mono>markdown</Badge>
                    ) : (
                      <Badge tone="amber" mono>html</Badge>
                    )}
                  </td>
                  <td className="py-1.5 pr-4 text-gray-900">
                    {r.contentType ?? "—"}
                  </td>
                  <td className="py-1.5 pr-4 text-gray-900">
                    {r.bytes.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
