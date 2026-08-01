import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const username = process.env.GITHUB_USERNAME ?? "mathewgeejo";
const token = process.env.GITHUB_TOKEN;
const outputPath = resolve(process.env.PROFILE_TELEMETRY_OUTPUT ?? "assets/telemetry.svg");

const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "profile-telemetry-generator",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

if (!response.ok) {
  throw new Error(`GitHub profile request failed: ${response.status} ${response.statusText}`);
}

const profile = await response.json();
const timestamp = new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
const pad = (value) => String(value ?? 0).padStart(3, "0");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 190" role="img" aria-labelledby="title description">
  <title id="title">Live profile telemetry</title>
  <desc id="description">GitHub telemetry for ${username}: ${profile.public_repos} public repositories and ${profile.followers} followers. Refreshed ${timestamp}.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07111d"/>
      <stop offset="1" stop-color="#101325"/>
    </linearGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#4ec9ff" stroke-opacity=".08" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="190" rx="14" fill="url(#background)"/>
  <rect width="1200" height="190" rx="14" fill="url(#grid)"/>
  <rect x="1" y="1" width="1198" height="188" rx="13" fill="none" stroke="#6ce0ff" stroke-opacity=".28"/>
  <circle cx="42" cy="38" r="6" fill="#58e6b4"/>
  <text x="58" y="43" fill="#d7f6ff" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="16" font-weight="700" letter-spacing="1.4">LAB TELEMETRY / PUBLIC SIGNAL</text>
  <text x="1154" y="43" fill="#80a5b5" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="12" text-anchor="end">${timestamp}</text>
  <path d="M 32 63 H 1168" stroke="#6ce0ff" stroke-opacity=".2"/>
  <path d="M 316 79 V 158 M 600 79 V 158 M 884 79 V 158" stroke="#6ce0ff" stroke-opacity=".16"/>
  <text x="32" y="94" fill="#80a5b5" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="12" letter-spacing="1.2">PUBLIC REPOS</text>
  <text x="32" y="140" fill="#6ce0ff" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="38" font-weight="700">${pad(profile.public_repos)}</text>
  <text x="348" y="94" fill="#80a5b5" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="12" letter-spacing="1.2">FOLLOWERS</text>
  <text x="348" y="140" fill="#b99aff" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="38" font-weight="700">${pad(profile.followers)}</text>
  <text x="632" y="94" fill="#80a5b5" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="12" letter-spacing="1.2">FOCUS SYSTEMS</text>
  <text x="632" y="140" fill="#58e6b4" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="38" font-weight="700">004</text>
  <text x="916" y="94" fill="#80a5b5" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="12" letter-spacing="1.2">OPERATING MODE</text>
  <text x="916" y="134" fill="#f2cb75" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="17" font-weight="700">BOUNDARY-FIRST</text>
  <text x="916" y="155" fill="#80a5b5" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="11">self-updating / GitHub REST</text>
</svg>`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${svg}\n`, "utf8");
