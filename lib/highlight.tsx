import { Fragment, type ReactNode } from "react";

const KEYWORDS = new Set([
  "import", "from", "export", "default", "const", "let", "var", "function",
  "async", "await", "return", "if", "else", "for", "while", "new", "type",
  "interface", "extends", "implements", "class", "this", "true", "false",
  "null", "undefined", "void", "typeof", "in", "of", "as", "satisfies",
]);

const colors = {
  keyword: "text-[#ff7b9c]",
  string: "text-[#7ff0e2]",
  comment: "text-gray-600 italic",
  number: "text-[#a371f7]",
  func: "text-[#6cb2ff]",
  jsx: "text-[#6ee787]",
  directive: "text-amber-700",
  punct: "text-gray-700",
  plain: "text-gray-1000",
};

type Tok = { text: string; cls: string };

function tokenizeLine(line: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;

  const trimmed = line.trimStart();
  if (trimmed.startsWith("//")) {
    return [{ text: line, cls: colors.comment }];
  }

  const directive = line.match(/^(\s*)(['"])(use [a-z: ]+)\2(;?)\s*$/);
  if (directive) {
    return [
      { text: directive[1], cls: colors.plain },
      { text: `${directive[2]}${directive[3]}${directive[2]}${directive[4]}`, cls: colors.directive },
    ];
  }

  const re =
    /(\/\/.*$)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|([^\sA-Za-z0-9_$]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > i) toks.push({ text: line.slice(i, m.index), cls: colors.plain });
    i = re.lastIndex;
    if (m[1]) toks.push({ text: m[1], cls: colors.comment });
    else if (m[2]) toks.push({ text: m[2], cls: colors.string });
    else if (m[3]) toks.push({ text: m[3], cls: colors.number });
    else if (m[4]) {
      const word = m[4];
      const after = line.slice(re.lastIndex).trimStart();
      if (KEYWORDS.has(word)) toks.push({ text: word, cls: colors.keyword });
      else if (after.startsWith("(")) toks.push({ text: word, cls: colors.func });
      else if (/^[A-Z]/.test(word)) toks.push({ text: word, cls: colors.jsx });
      else toks.push({ text: word, cls: colors.plain });
    } else if (m[5]) toks.push({ text: m[5], cls: colors.plain });
    else if (m[6]) toks.push({ text: m[6], cls: colors.punct });
  }
  if (i < line.length) toks.push({ text: line.slice(i), cls: colors.plain });
  return toks;
}

export function highlightLines(code: string): ReactNode[] {
  return code.replace(/\n$/, "").split("\n").map((line, idx) => (
    <Fragment key={idx}>
      {line.length === 0
        ? " "
        : tokenizeLine(line).map((t, j) => (
            <span key={j} className={t.cls}>
              {t.text}
            </span>
          ))}
    </Fragment>
  ));
}
