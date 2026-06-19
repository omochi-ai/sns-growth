import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

interface LinkItem {
  label: string;
  description?: string;
  url: string;
  badge?: string;
  highlight?: boolean;
}

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
  optional?: boolean;
}

interface LinkPageConfig {
  title: string;
  tagline: string;
  avatarEmoji?: string;
  primaryLinks: LinkItem[];
  socialLinks: SocialLink[];
  footer?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSocialIcon(icon?: string): string {
  switch (icon) {
    case "threads":
      return "@";
    case "x":
      return "𝕏";
    case "note":
      return "n";
    default:
      return "→";
  }
}

export function buildLinkPageHtml(config: LinkPageConfig): string {
  const linksHtml = config.primaryLinks
    .map((link) => {
      const cls = link.highlight ? "link-card highlight" : "link-card";
      const badge = link.badge
        ? `<span class="badge">${escapeHtml(link.badge)}</span>`
        : "";
      const desc = link.description
        ? `<span class="desc">${escapeHtml(link.description)}</span>`
        : "";
      return `<a class="${cls}" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
  <span class="label">${escapeHtml(link.label)}${badge}</span>
  ${desc}
</a>`;
    })
    .join("\n");

  const socialHtml = config.socialLinks
    .filter((s) => s.url && s.url !== "#")
    .map(
      (s) =>
        `<a class="social" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(s.platform)}">${renderSocialIcon(s.icon)} ${escapeHtml(s.platform)}</a>`
    )
    .join("\n");

  const optionalSocial = config.socialLinks
    .filter((s) => s.optional && (!s.url || s.url === "#"))
    .map((s) => `<span class="social muted">${escapeHtml(s.platform)}（URL未設定）</span>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(config.tagline)}">
  <title>${escapeHtml(config.title)}</title>
  <style>
    :root {
      --bg: #0f0f14;
      --card: #1a1a24;
      --card-hover: #222230;
      --accent: #6c8cff;
      --accent-soft: #3d4f80;
      --text: #f0f0f5;
      --muted: #9898a8;
      --highlight: linear-gradient(135deg, #3d4f80 0%, #1a1a24 100%);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem 3rem;
      line-height: 1.5;
    }
    .container { width: 100%; max-width: 420px; }
    .profile { text-align: center; margin-bottom: 2rem; }
    .avatar {
      width: 80px; height: 80px; border-radius: 50%;
      background: var(--highlight);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; margin: 0 auto 1rem;
      border: 2px solid var(--accent-soft);
    }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    .tagline { color: var(--muted); font-size: 0.9rem; }
    .links { display: flex; flex-direction: column; gap: 0.75rem; }
    .link-card {
      display: block; background: var(--card); border-radius: 12px;
      padding: 1rem 1.1rem; text-decoration: none; color: var(--text);
      border: 1px solid transparent; transition: background 0.15s, border-color 0.15s;
    }
    .link-card:hover { background: var(--card-hover); border-color: var(--accent-soft); }
    .link-card.highlight { background: var(--highlight); border-color: var(--accent); }
    .label { display: block; font-weight: 600; font-size: 0.95rem; }
    .badge {
      display: inline-block; margin-left: 0.4rem; font-size: 0.7rem;
      background: var(--accent); color: #fff; padding: 0.1rem 0.45rem;
      border-radius: 999px; vertical-align: middle; font-weight: 500;
    }
    .desc { display: block; margin-top: 0.35rem; font-size: 0.8rem; color: var(--muted); }
    .social-row {
      display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;
      margin-top: 2rem;
    }
    .social {
      color: var(--text); text-decoration: none; font-size: 0.85rem;
      padding: 0.45rem 0.85rem; border-radius: 999px;
      background: var(--card); border: 1px solid var(--accent-soft);
    }
    .social:hover { background: var(--card-hover); }
    .social.muted { color: var(--muted); border-style: dashed; }
    footer { text-align: center; margin-top: 2.5rem; color: var(--muted); font-size: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <header class="profile">
      <div class="avatar">${escapeHtml(config.avatarEmoji ?? "⚡")}</div>
      <h1>${escapeHtml(config.title)}</h1>
      <p class="tagline">${escapeHtml(config.tagline)}</p>
    </header>
    <nav class="links" aria-label="メインリンク">
${linksHtml}
    </nav>
    <div class="social-row">
${socialHtml}
${optionalSocial}
    </div>
    <footer>${escapeHtml(config.footer ?? "")}</footer>
  </div>
</body>
</html>`;
}

export function buildLinkPage(options?: {
  configPath?: string;
  outputPath?: string;
}): string {
  const configPath = options?.configPath ?? "linkpage/config.json";
  const outputPath = options?.outputPath ?? "docs/index.html";
  const config = JSON.parse(
    readFileSync(configPath, "utf-8")
  ) as LinkPageConfig;
  const html = buildLinkPageHtml(config);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, "utf-8");
  return outputPath;
}
