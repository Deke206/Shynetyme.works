import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repository = process.env.WORK_HISTORY_REPOSITORY || process.env.GITHUB_REPOSITORY || "Deke206/thethinkingtank";
const branch = process.env.WORK_HISTORY_BRANCH || "main";
const token = process.env.GITHUB_TOKEN || "";
const outputPath = resolve(process.cwd(), process.env.WORK_HISTORY_OUTPUT || "assets/data/work-history.json");
const [owner, repo] = repository.split("/");

if (!owner || !repo) throw new Error(`Invalid repository name: ${repository}`);

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "shynetyme-work-history-generator",
  "X-GitHub-Api-Version": "2022-11-28"
};

if (token) headers.Authorization = `Bearer ${token}`;

const commits = [];
const seen = new Set();
let page = 1;

while (page <= 20) {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
  url.searchParams.set("sha", branch);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", String(page));

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }

  const items = await response.json();
  if (!Array.isArray(items) || !items.length) break;

  for (const item of items) {
    const message = String(item.commit?.message || "Website update")
      .split(/\r?\n/, 1)[0]
      .replace(/\s+/g, " ")
      .trim();

    if (!item.sha || seen.has(item.sha)) continue;
    if (/^chore\(history\): refresh read-only website timeline/i.test(message)) continue;

    const date = item.commit?.author?.date || item.commit?.committer?.date;
    if (!date) continue;

    seen.add(item.sha);
    commits.push({ sha: item.sha, date, message });
  }

  if (items.length < 100) break;
  page += 1;
}

commits.sort((a, b) => new Date(a.date) - new Date(b.date));

const payload = {
  repository,
  branch,
  generatedAt: new Date().toISOString(),
  commitCount: commits.length,
  commits
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${commits.length} commits to ${outputPath}`);
