"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/**
 * The lab's measuring device. Fetches a same-origin URL with either a
 * browser's Accept header (text/html) or an agent's Accept header
 * (text/markdown), then shows the response body, Content-Type, payload
 * size, and estimated token count.
 *
 * In "compare" mode, it fetches both and shows the savings side-by-side.
 * This is how you emulate an agent viewing your site — the toggle IS the
 * agent/browser switch.
 */

type Mode = "browser" | "agent" | "compare";

type ResponseData = {
  status: number;
  contentType: string | null;
  body: string;
  bytes: number;
  tokens: number;
  ms: number;
};

const ACCEPT_HEADERS = {
  browser: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  agent: "text/markdown,text/html,*/*;q=0.1",
};

function estimateTokens(text: string): number {
  return Math.ceil(new TextEncoder().encode(text).length / 4);
}

export function AgentProbe({
  path,
  className,
  defaultMode = "compare",
}: {
  path: string;
  className?: string;
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [browserResp, setBrowserResp] = useState<ResponseData | null>(null);
  const [agentResp, setAgentResp] = useState<ResponseData | null>(null);
  const [busy, setBusy] = useState<"browser" | "agent" | "both" | null>(null);

  const doFetch = useCallback(
    async (which: "browser" | "agent") => {
      setBusy(which === "browser" ? "browser" : "agent");
      const started = performance.now();
      try {
        const res = await fetch(path, {
          cache: "no-store",
          headers: { accept: ACCEPT_HEADERS[which] },
        });
        const body = await res.text();
        const data: ResponseData = {
          status: res.status,
          contentType: res.headers.get("content-type"),
          body,
          bytes: new TextEncoder().encode(body).length,
          tokens: estimateTokens(body),
          ms: Math.round(performance.now() - started),
        };
        if (which === "browser") setBrowserResp(data);
        else setAgentResp(data);
      } catch {
        const data: ResponseData = {
          status: 0,
          contentType: null,
          body: "fetch error",
          bytes: 0,
          tokens: 0,
          ms: Math.round(performance.now() - started),
        };
        if (which === "browser") setBrowserResp(data);
        else setAgentResp(data);
      } finally {
        setBusy(null);
      }
    },
    [path],
  );

  const fetchBoth = useCallback(async () => {
    setBusy("both");
    await Promise.all([doFetch("browser"), doFetch("agent")]);
    setBusy(null);
  }, [doFetch]);

  const fetchCurrent = useCallback(() => {
    if (mode === "browser") doFetch("browser");
    else if (mode === "agent") doFetch("agent");
    else fetchBoth();
  }, [mode, doFetch, fetchBoth]);

  const savings =
    browserResp && agentResp && browserResp.bytes > 0
      ? Math.round(100 - (agentResp.bytes / browserResp.bytes) * 100)
      : null;

  const tokenSavings =
    browserResp && agentResp && browserResp.tokens > 0
      ? Math.round(100 - (agentResp.tokens / browserResp.tokens) * 100)
      : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-400 bg-background-200 p-4",
        className,
      )}
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-label-13-mono text-gray-700">
          probe <span className="text-gray-1000">{path}</span>
        </span>

        <div className="flex rounded-md border border-gray-400 bg-background-300 p-0.5">
          {(["browser", "agent", "compare"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded px-2.5 py-1 text-label-12 font-medium transition-colors",
                mode === m
                  ? m === "browser"
                    ? "bg-amber-600/20 text-amber-700"
                    : m === "agent"
                      ? "bg-blue-600/20 text-blue-700"
                      : "bg-purple-700/20 text-purple-900"
                  : "text-gray-700 hover:text-gray-1000",
              )}
            >
              {m === "browser"
                ? "Browser"
                : m === "agent"
                  ? "Agent"
                  : "Compare"}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={fetchCurrent}
          disabled={busy !== null}
        >
          {busy !== null ? "Fetching..." : "Fetch"}
        </Button>
      </div>

      {/* Accept header display */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-label-12-mono text-gray-700">
        <span className="text-gray-500">accept:</span>
        {mode === "browser" && (
          <code className="text-amber-700">{ACCEPT_HEADERS.browser}</code>
        )}
        {mode === "agent" && (
          <code className="text-blue-700">{ACCEPT_HEADERS.agent}</code>
        )}
        {mode === "compare" && (
          <>
            <code className="text-amber-700">{ACCEPT_HEADERS.browser}</code>
            <span className="text-gray-500">+</span>
            <code className="text-blue-700">{ACCEPT_HEADERS.agent}</code>
          </>
        )}
      </div>

      {/* Savings banner (compare mode only) */}
      {savings !== null && mode === "compare" && (
        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md border border-green-600/30 bg-green-600/[0.06] px-3 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-label-12 text-gray-500">payload</span>
            <span className="text-label-14-mono text-green-700">
              {savings}% smaller
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-label-12 text-gray-500">tokens</span>
            <span className="text-label-14-mono text-green-700">
              {tokenSavings}% fewer
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-label-12 text-gray-500">saved</span>
            <span className="text-label-14-mono text-green-700">
              {(browserResp!.bytes - agentResp!.bytes).toLocaleString()} bytes
            </span>
          </div>
        </div>
      )}

      {/* Response panels */}
      <div
        className={cn(
          "mt-4 grid gap-3",
          mode === "compare" ? "md:grid-cols-2" : "grid-cols-1",
        )}
      >
        {(mode === "browser" || mode === "compare") && browserResp && (
          <ResponsePanel
            label="Browser"
            tone="amber"
            data={browserResp}
          />
        )}
        {(mode === "agent" || mode === "compare") && agentResp && (
          <ResponsePanel
            label="Agent"
            tone="blue"
            data={agentResp}
          />
        )}
      </div>

      {/* Empty state */}
      {!browserResp && !agentResp && (
        <p className="mt-4 text-label-13 text-gray-700">
          Click <span className="text-gray-1000">Fetch</span> to send a request
          and see what a {mode === "agent" ? "agent" : mode === "browser" ? "browser" : "browser and agent"}{" "}
          receives from <code className="text-gray-1000">{path}</code>.
        </p>
      )}
    </div>
  );
}

function ResponsePanel({
  label,
  tone,
  data,
}: {
  label: string;
  tone: "amber" | "blue";
  data: ResponseData;
}) {
  const isMarkdown = data.contentType?.includes("text/markdown");
  const truncated = data.body.length > 5000;
  const displayBody = truncated ? data.body.slice(0, 5000) + "\n\n... (truncated)" : data.body;

  return (
    <div className="rounded-md border border-gray-400 bg-background-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-400 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge tone={tone} mono>{label}</Badge>
          {isMarkdown && <Badge tone="green" mono>markdown</Badge>}
          {!isMarkdown && data.contentType && <Badge tone="amber" mono>html</Badge>}
        </div>
        <span className="text-label-12-mono text-gray-700">{data.ms}ms</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-400 px-3 py-2 text-label-12-mono">
        <div className="flex items-baseline gap-1">
          <span className="text-gray-500">status</span>
          <span className={data.status >= 200 && data.status < 300 ? "text-green-700" : "text-red-700"}>
            {data.status || "ERR"}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-gray-500">type</span>
          <span className="text-gray-1000">{data.contentType ?? "—"}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-gray-500">bytes</span>
          <span className="text-gray-1000">{data.bytes.toLocaleString()}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-gray-500">~tokens</span>
          <span className="text-gray-1000">{data.tokens.toLocaleString()}</span>
        </div>
      </div>

      {/* Body preview */}
      <div className="max-h-96 overflow-auto">
        <pre className="px-3 py-2 text-label-12-mono leading-relaxed text-gray-900 whitespace-pre-wrap break-words">
          {displayBody}
        </pre>
      </div>
    </div>
  );
}
