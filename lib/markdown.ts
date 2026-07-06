/**
 * A minimal markdown-to-HTML renderer.
 *
 * Handles the subset of markdown used in our blog posts: headings (h1-h6),
 * paragraphs, fenced code blocks, inline code, links, bold, italic,
 * unordered/ordered lists, blockquotes, and horizontal rules.
 *
 * This is intentionally not a full CommonMark parser — it's enough to render
 * the blog content as styled HTML for the browser representation, so the
 * visual difference between HTML and markdown is clear in the lab.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  let out = escapeHtml(text);

  // Inline code (must be first to protect content from other replacements)
  out = out.replace(
    /`([^`]+)`/g,
    (_m, code) => `<code>${code}</code>`,
  );

  // Links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, text, url) => `<a href="${url}">${text}</a>`,
  );

  // Bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic *text* (but not ** which is bold)
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");

  return out;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const langAttr = lang ? ` data-lang="${lang}"` : "";
      html.push(`<pre${langAttr}><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = renderInline(headingMatch[2]);
      html.push(`<h${level}>${text}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      html.push("<hr />");
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        quoteLines.push(lines[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      html.push(`<blockquote>${renderInline(quoteLines.join(" "))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, "");
        // Handle numbered sub-items or continuation
        items.push(`<li>${renderInline(itemText)}</li>`);
        i++;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, "");
        items.push(`<li>${renderInline(itemText)}</li>`);
        i++;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Table (pipe-delimited)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s-:]+\|/.test(lines[i + 1])) {
      const headerCells = line.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
      i += 2; // skip header and separator
      const rows: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().length > 0) {
        const cells = lines[i].split("|").map((c) => c.trim()).filter((c) => c.length > 0);
        rows.push(
          `<tr>${cells.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`,
        );
        i++;
      }
      const headerRow = `<tr>${headerCells.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr>`;
      html.push(`<table><thead>${headerRow}</thead><tbody>${rows.join("")}</tbody></table>`);
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("#") &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].trimStart().startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html.push(`<p>${renderInline(paraLines.join(" "))}</p>`);
    }
  }

  return html.join("\n");
}

/**
 * Estimate the number of tokens in a string.
 * Rough approximation: ~4 bytes per token for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(new TextEncoder().encode(text).length / 4);
}
