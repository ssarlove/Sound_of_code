// server/analyzeRepo.js
import fetch from "node-fetch";
import { GEMINI_API_KEY } from "./config.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

async function fetchGitHubText(repo) {
  const base = `https://raw.githubusercontent.com/${repo}`;
  const paths = [
    "main/README.md",
    "master/README.md",
    "main/package.json",
    "main/src/index.js",
    "main/src/App.tsx"
  ];

  let collected = "";

  for (const p of paths) {
    try {
      const res = await fetch(`${base}/${p}`);
      if (res.ok) {
        collected += `\n\n### ${p}\n${await res.text()}`;
      }
    } catch {}
  }

  return collected.slice(0, 12000);
}

export async function analyzeRepoWithGemini(repo) {
  const repoText = await fetchGitHubText(repo);

  const prompt = `
You are analyzing a GitHub repository to generate music.

Analyze:
- emotional tone
- technical complexity
- pace (fast/slow)
- genre vibe (ambient, intense, minimal, glitchy, melodic, industrial)

Return STRICT JSON:

{
  "mood": "dark | neutral | bright | mysterious | aggressive",
  "energy": 0.0-1.0,
  "complexity": 0.0-1.0,
  "style": "ambient | melodic | rhythmic | glitchy | industrial | ethereal",
  "tempo": 60-160,
  "scale": "major | minor | dorian | phrygian | chromatic",
  "description": "short poetic description"
}

Repository content:
${repoText}
`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;

  return JSON.parse(text);
}
