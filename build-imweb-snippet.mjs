import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(here);
const homepageDir = join(projectRoot, "wncw-homepage");

const html = await readFile(join(homepageDir, "index.html"), "utf8");
const css = await readFile(join(homepageDir, "styles.css"), "utf8");

const bodyMatch = html.match(/<body>\s*([\s\S]*?)\s*<\/body>/);

if (!bodyMatch) {
  throw new Error("Could not find <body> content in homepage HTML.");
}

let body = bodyMatch[1].replace(/\s*<script src="\.\/script\.js"><\/script>\s*/g, "").trim();

const anchorIds = ["top", "product", "problem", "scope", "operation", "process", "contact"];

for (const id of anchorIds) {
  body = body.replaceAll(`id="${id}"`, `id="wncw-${id}"`).replaceAll(`href="#${id}"`, `href="#wncw-${id}"`);
}

const scopeSelector = (selector) =>
  selector
    .split(",")
    .map((raw) => {
      const part = raw.trim();

      if (!part) return part;
      if (part === ":root" || part === "html" || part === "body") return "#wncw-imweb-page";
      if (part.startsWith("body.nav-open")) return part.replace("body.nav-open", "#wncw-imweb-page.wncw-nav-open");
      if (part.startsWith("body ")) return `#wncw-imweb-page ${part.slice(5)}`;
      if (part.startsWith("html ")) return `#wncw-imweb-page ${part.slice(5)}`;
      if (part.startsWith("#wncw-imweb-page")) return part;

      return `#wncw-imweb-page ${part}`;
    })
    .join(",\n");

const scopeCss = (source) => {
  const lines = source.split("\n");
  const output = [];
  let selectorLines = [];
  const stack = [];

  const flushSelector = (suffix = " {") => {
    output.push(`${scopeSelector(selectorLines.join("\n"))}${suffix}`);
    selectorLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const current = stack[stack.length - 1];

    if (current === "rule") {
      output.push(line);

      if (trimmed === "}") {
        stack.pop();
      }

      continue;
    }

    if (!selectorLines.length && !trimmed) {
      output.push(line);
      continue;
    }

    if (!selectorLines.length && trimmed === "}") {
      output.push(line);

      if (stack.length) {
        stack.pop();
      }

      continue;
    }

    if (!selectorLines.length && trimmed.startsWith("@")) {
      output.push(line);

      if (trimmed.endsWith("{")) {
        stack.push("at");
      }

      continue;
    }

    if (trimmed.endsWith("{")) {
      const selector = trimmed.slice(0, -1).trim();

      if (selector.startsWith("@")) {
        output.push(line);
        stack.push("at");
        continue;
      }

      selectorLines.push(selector);
      flushSelector(" {");
      stack.push("rule");
      continue;
    }

    if (selectorLines.length || trimmed.endsWith(",")) {
      selectorLines.push(trimmed);
      continue;
    }

    output.push(line);
  }

  if (selectorLines.length) {
    output.push(...selectorLines);
  }

  return output.join("\n");
};

const scopedCss = scopeCss(css);

const imwebGuardCss = `
#wncw-imweb-page {
  display: block !important;
  position: relative;
  z-index: 0;
  width: var(--wncw-page-width, 100%);
  max-width: var(--wncw-page-width, 100%);
  min-width: 0;
  margin-left: var(--wncw-page-margin, 0);
  margin-right: var(--wncw-page-margin, 0);
  isolation: isolate;
  font-style: normal;
  text-align: left;
}

#wncw-imweb-page,
#wncw-imweb-page *,
#wncw-imweb-page *::before,
#wncw-imweb-page *::after {
  box-sizing: border-box !important;
}

#wncw-imweb-page header,
#wncw-imweb-page main,
#wncw-imweb-page section,
#wncw-imweb-page footer,
#wncw-imweb-page nav,
#wncw-imweb-page article,
#wncw-imweb-page div {
  min-width: 0;
}

#wncw-imweb-page img {
  max-width: 100%;
  border: 0;
  vertical-align: middle;
}

#wncw-imweb-page .site-header,
#wncw-imweb-page .hero-grid,
#wncw-imweb-page .product-grid,
#wncw-imweb-page .split-section,
#wncw-imweb-page .issue-grid,
#wncw-imweb-page .scope-grid,
#wncw-imweb-page .pilot-layout,
#wncw-imweb-page .pilot-board,
#wncw-imweb-page .process-layout,
#wncw-imweb-page .process-list,
#wncw-imweb-page .usecase-layout,
#wncw-imweb-page .usecase-panel,
#wncw-imweb-page .contact-box,
#wncw-imweb-page .footer-layout {
  display: grid;
}

#wncw-imweb-page .hero-actions,
#wncw-imweb-page .brand,
#wncw-imweb-page .button,
#wncw-imweb-page .footer-links {
  display: flex;
}

#wncw-imweb-page .browser-shot img {
  display: block;
  width: 100%;
}
`;

const inlineScript = `
<script>
(() => {
  const root = document.getElementById('wncw-imweb-page');
  if (!root) return;

  const header = root.querySelector('[data-header]');
  const navToggle = root.querySelector('[data-nav-toggle]');
  const navLinks = root.querySelectorAll('.site-nav a, .header-cta');

  const syncFrame = () => {
    const width = document.documentElement.clientWidth || window.innerWidth;
    root.style.setProperty('--wncw-page-width', width + 'px');
    root.style.setProperty('--wncw-page-margin', 'calc(50% - ' + width / 2 + 'px)');
  };

  const setScrolled = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  syncFrame();
  setScrolled();
  window.addEventListener('resize', syncFrame, { passive: true });
  window.addEventListener('scroll', setScrolled, { passive: true });

  navToggle?.addEventListener('click', () => {
    const isOpen = root.classList.toggle('wncw-nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      root.classList.remove('wncw-nav-open');
      navToggle?.setAttribute('aria-expanded', 'false');
      navToggle?.setAttribute('aria-label', '메뉴 열기');
    });
  });
})();
</script>`;

const renderSnippet = (useCdn) => {
  const srcBase = useCdn ? "https://cdn.jsdelivr.net/gh/wncw/wncw-imweb-assets@main/assets/" : "./assets/";
  const renderedBody = body.replaceAll('src="./assets/', `src="${srcBase}`);

  return `<style>\n${scopedCss}\n${imwebGuardCss}\n</style>\n\n<div id="wncw-imweb-page" class="wncw-imweb-page">\n${renderedBody}\n</div>\n\n${inlineScript}\n`;
};

await writeFile(join(here, "imweb-code.html"), renderSnippet(true), "utf8");
await writeFile(
  join(here, "preview-local.html"),
  `<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>WNCW Imweb Preview</title>\n</head>\n<body style="margin:0">\n${renderSnippet(false)}\n</body>\n</html>\n`,
  "utf8",
);
