// Minimal, safe-ish Markdown renderer without external deps.
// Supports: headings (#..######), bold ** **, italic * *, inline code ``,
// fenced code blocks ```lang, lists (-, *, 1.), links [text](url), paragraphs, line breaks.

function escapeHtml(html = "") {
  return String(html)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInline(md = "") {
  // inline code first
  let s = md.replace(/`([^`]+?)`/g, (m, code) => `<code>${escapeHtml(code)}</code>`);
  // bold
  s = s.replace(/\*\*([^\*]+?)\*\*/g, (m, t) => `<strong>${t}</strong>`);
  // italic (avoid replacing bold markers)
  s = s.replace(/(^|\W)\*([^\*]+?)\*(?=\W|$)/g, (m, pre, t) => `${pre}<em>${t}</em>`);
  // links [text](url)
  s = s.replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g, (m, text, url) => {
    const safeText = escapeHtml(text);
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  });
  return s;
}

export function renderMarkdown(md = "") {
  if (!md) return "";
  const lines = String(md).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let inCode = false;
  let codeLang = "";
  let codeBuf = [];

  const flushCode = () => {
    if (!inCode) return;
    const code = escapeHtml(codeBuf.join("\n"));
    const cls = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : "";
    out.push(`<pre><code${cls}>${code}</code></pre>`);
    inCode = false; codeLang = ""; codeBuf = [];
  };

  const flushPara = (buf) => {
    if (!buf.length) return;
    const text = buf.join(" ").trim();
    if (!text) return;
    out.push(`<p>${renderInline(escapeHtml(text))}</p>`);
  };

  let paraBuf = [];

  for (const raw of lines) {
    const line = raw;
    const fence = line.match(/^```\s*([a-zA-Z0-9_-]+)?\s*$/);
    if (fence) {
      if (inCode) {
        flushCode();
      } else {
        // starting a fenced block
        flushPara(paraBuf); paraBuf = [];
        inCode = true;
        codeLang = fence[1] || "";
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara(paraBuf); paraBuf = [];
      const level = h[1].length;
      const content = renderInline(escapeHtml(h[2].trim()));
      out.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    // lists
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      flushPara(paraBuf); paraBuf = [];
      // collect consecutive list items
      const cur = [ul ? "ul" : "ol", []];
      cur[1].push(ul ? ul[1] : ol[1]);
      // lookahead over following lines
      // we will process in a simple single pass by pushing and continuing
      out.push(cur); // temporary marker, resolve later
      continue;
    }

    if (!line.trim()) {
      flushPara(paraBuf); paraBuf = [];
    } else {
      paraBuf.push(line);
    }
  }

  // finalize
  flushCode();
  flushPara(paraBuf);

  // Resolve list markers: convert array markers into actual lists
  const resolved = [];
  for (let i = 0; i < out.length; i++) {
    const item = out[i];
    if (Array.isArray(item) && (item[0] === "ul" || item[0] === "ol")) {
      const type = item[0];
      const items = [];
      // merge consecutive list markers of the same type
      let j = i;
      while (j < out.length && Array.isArray(out[j]) && out[j][0] === type) {
        items.push(...out[j][1]);
        j++;
      }
      i = j - 1;
      const lis = items.map((t) => `<li>${renderInline(escapeHtml(String(t)))}</li>`).join("");
      resolved.push(`<${type}>${lis}</${type}>`);
    } else {
      resolved.push(item);
    }
  }

  return resolved.join("\n");
}

export default renderMarkdown;
export { escapeHtml };
