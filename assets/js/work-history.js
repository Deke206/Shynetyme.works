/**
 * About Deke read-only work-history timeline.
 * Combines the verified August 8 archive with the current ShyneTyme.Works repo.
 */
(() => {
  "use strict";

  const root = document.querySelector("[data-work-history]");
  if (!root) return;

  const scriptElement = document.currentScript;
  const scriptUrl = scriptElement?.src
    ? new URL(scriptElement.src, window.location.href)
    : new URL("assets/js/work-history.js", window.location.href);
  const siteRoot = new URL("../../", scriptUrl);

  const repository = root.dataset.repository || "Deke206/Shynetyme.works";
  const branch = root.dataset.branch || "main";
  const timeline = root.querySelector("[data-work-history-timeline]");
  const status = root.querySelector("[data-work-history-status]");
  const totalValue = root.querySelector("[data-work-history-total]");
  const activeDaysValue = root.querySelector("[data-work-history-days]");
  const firstValue = root.querySelector("[data-work-history-first]");
  const latestValue = root.querySelector("[data-work-history-latest]");

  if (!timeline || !status || !totalValue || !activeDaysValue || !firstValue || !latestValue) return;

  const TIME_ZONE = "America/Los_Angeles";
  const CACHE_KEY = `shynetyme-work-history:${repository}:${branch}:v4`;
  const CACHE_TTL = 10 * 60 * 1000;
  const MAX_PAGES = 10;

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit"
  });

  const setStatus = (message, state = "ready") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const cleanMessage = (value = "") => String(value)
    .replace(/\r\n/g, "\n")
    .trim();

  const normalizeCommit = (item, defaultSource = "current") => {
    const fullMessage = cleanMessage(item.fullMessage || item.message || item.commit?.message || "Website update");
    const [titleLine = "Website update", ...detailLines] = fullMessage.split("\n");
    return {
      sha: String(item.sha || "").trim(),
      date: item.date || item.commit?.author?.date || item.commit?.committer?.date || "",
      message: titleLine.replace(/\s+/g, " ").trim() || "Website update",
      details: detailLines.join("\n").trim(),
      source: item.source || defaultSource
    };
  };

  const shouldDisplay = (commit) => commit.sha
    && commit.date
    && !/^chore\(history\): refresh read-only website timeline/i.test(commit.message);

  const localDayKey = (dateValue) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date(dateValue));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const classify = (message) => {
    const value = message.toLowerCase();
    if (/chuck|sprite|helper|thought/.test(value)) return { key: "chuck", label: "Chuck" };
    if (/home sim|bike sim|auto sim|builder|configurator|build my/.test(value)) return { key: "builder", label: "Builder" };
    if (/led|matrix|banner|wled|lighting|light strip/.test(value)) return { key: "led", label: "LED" };
    if (/fix|repair|restore|hotfix|bug|broken|missing|correct/.test(value)) return { key: "fix", label: "Fix" };
    if (/about|copy|content|wording|text|privacy|terms/.test(value)) return { key: "content", label: "Content" };
    if (/css|style|design|header|hero|carousel|navigation|navbar|layout|image/.test(value)) return { key: "design", label: "Design" };
    if (/project power|product|scraper/.test(value)) return { key: "project-power", label: "Project Power" };
    if (/workflow|history|docs|document/.test(value)) return { key: "process", label: "Process" };
    return { key: "website", label: "Website" };
  };

  const readCache = () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!cached || Date.now() - cached.savedAt > CACHE_TTL || !Array.isArray(cached.commits)) return null;
      return cached.commits;
    } catch {
      return null;
    }
  };

  const writeCache = (commits) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), commits }));
    } catch {
      // Timeline remains usable when storage is blocked.
    }
  };

  const fetchArchive = async () => {
    const url = new URL("assets/data/work-history.json", siteRoot);
    url.searchParams.set("v", "20260808-archive");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("August 8 archive is unavailable.");
    const data = await response.json();
    if (!Array.isArray(data.commits) || !data.commits.length) throw new Error("August 8 archive is empty.");
    return data.commits
      .map((item) => normalizeCommit({ ...item, source: "archive" }, "archive"))
      .filter(shouldDisplay);
  };

  const fetchCurrentHistory = async () => {
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) throw new Error("Current repository name is invalid.");

    const commits = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
      url.searchParams.set("sha", branch);
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal
        });
        if (!response.ok) {
          const remaining = response.headers.get("x-ratelimit-remaining");
          if (response.status === 403 && remaining === "0") {
            throw new Error("GitHub public viewing limit temporarily reached.");
          }
          throw new Error(`Current history request failed (${response.status}).`);
        }

        const items = await response.json();
        if (!Array.isArray(items) || !items.length) break;
        commits.push(...items.map((item) => normalizeCommit({
          sha: item.sha,
          date: item.commit?.author?.date || item.commit?.committer?.date,
          fullMessage: item.commit?.message,
          source: "current"
        }, "current")).filter(shouldDisplay));
        if (items.length < 100) break;
      } finally {
        window.clearTimeout(timer);
      }
    }
    return commits;
  };

  const mergeHistory = (currentCommits, archiveCommits) => {
    const unique = new Map();
    [...currentCommits, ...archiveCommits].forEach((commit) => {
      if (!unique.has(commit.sha)) unique.set(commit.sha, commit);
    });
    return [...unique.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const buildEntry = (commit) => {
    const item = document.createElement("li");
    item.className = "work-history__entry";

    const copy = document.createElement("div");
    copy.className = "work-history__entry-copy";

    const message = document.createElement("span");
    message.className = "work-history__message";
    message.textContent = commit.message;
    copy.appendChild(message);

    if (commit.details) {
      const details = document.createElement("p");
      details.className = "work-history__details";
      details.textContent = commit.details;
      copy.appendChild(details);
    }

    const meta = document.createElement("div");
    meta.className = "work-history__meta";

    const time = document.createElement("time");
    time.dateTime = commit.date;
    time.textContent = timeFormatter.format(new Date(commit.date));

    const hash = document.createElement("code");
    hash.className = "work-history__hash";
    hash.textContent = commit.sha.slice(0, 8);
    hash.title = "Read-only commit identifier";

    const source = document.createElement("span");
    source.className = "work-history__source";
    source.dataset.source = commit.source;
    source.textContent = commit.source === "archive" ? "Aug 8 archive" : "Current repo";

    meta.append(time, hash, source);
    copy.appendChild(meta);

    const category = classify(`${commit.message} ${commit.details}`);
    const tag = document.createElement("span");
    tag.className = "work-history__tag";
    tag.dataset.kind = category.key;
    tag.textContent = category.label;

    item.append(copy, tag);
    return item;
  };

  const render = (rawCommits, sourceLabel) => {
    const commits = rawCommits
      .map((item) => normalizeCommit(item, item.source || "current"))
      .filter(shouldDisplay)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    timeline.replaceChildren();
    if (!commits.length) {
      const empty = document.createElement("li");
      empty.className = "work-history__empty";
      empty.textContent = "The work-history record is not available right now.";
      timeline.appendChild(empty);
      totalValue.textContent = "—";
      activeDaysValue.textContent = "—";
      firstValue.textContent = "—";
      latestValue.textContent = "—";
      setStatus("Work-history record unavailable.", "error");
      return;
    }

    const groups = new Map();
    commits.forEach((commit) => {
      const key = localDayKey(commit.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(commit);
    });

    const fragment = document.createDocumentFragment();
    groups.forEach((dayCommits) => {
      const dayItem = document.createElement("li");
      dayItem.className = "work-history__day";

      const heading = document.createElement("h3");
      heading.className = "work-history__day-heading";

      const dateText = document.createElement("span");
      dateText.textContent = dayFormatter.format(new Date(dayCommits[0].date));

      const count = document.createElement("span");
      count.className = "work-history__day-count";
      count.textContent = `${dayCommits.length} ${dayCommits.length === 1 ? "change" : "changes"}`;
      heading.append(dateText, count);

      const entries = document.createElement("ol");
      entries.className = "work-history__entries";
      dayCommits.forEach((commit) => entries.appendChild(buildEntry(commit)));

      dayItem.append(heading, entries);
      fragment.appendChild(dayItem);
    });

    const oldest = commits[commits.length - 1];
    const newest = commits[0];
    timeline.appendChild(fragment);
    timeline.scrollTop = 0;
    totalValue.textContent = commits.length.toLocaleString("en-US");
    activeDaysValue.textContent = groups.size.toLocaleString("en-US");
    firstValue.textContent = shortDateFormatter.format(new Date(oldest.date));
    latestValue.textContent = shortDateFormatter.format(new Date(newest.date));
    setStatus(`${sourceLabel} · newest to oldest · ${commits.length.toLocaleString("en-US")} read-only changes`);
  };

  const load = async () => {
    const cached = readCache();
    if (cached?.length) {
      render(cached, "Cached ShyneTyme.Works + August 8 archive");
    } else {
      setStatus("Loading current ShyneTyme.Works history and August 8 archive…", "loading");
    }

    const [currentResult, archiveResult] = await Promise.allSettled([
      fetchCurrentHistory(),
      fetchArchive()
    ]);

    const current = currentResult.status === "fulfilled" ? currentResult.value : [];
    const archive = archiveResult.status === "fulfilled" ? archiveResult.value : [];
    const merged = mergeHistory(current, archive);

    if (merged.length) {
      writeCache(merged);
      if (current.length && archive.length) {
        render(merged, "Live ShyneTyme.Works + August 8 archive");
      } else if (current.length) {
        render(merged, "Live ShyneTyme.Works · August 8 archive temporarily unavailable");
      } else {
        render(merged, "August 8 archive · live ShyneTyme.Works temporarily unavailable");
      }
      return;
    }

    if (cached?.length) {
      setStatus("Showing cached work history; live sources are temporarily unavailable.", "error");
      return;
    }

    render([], "Unavailable");
  };

  load().catch(() => {
    const cached = readCache();
    if (cached?.length) {
      render(cached, "Cached ShyneTyme.Works + August 8 archive");
      setStatus("Showing cached work history; live refresh failed.", "error");
    } else {
      render([], "Unavailable");
    }
  });
})();
