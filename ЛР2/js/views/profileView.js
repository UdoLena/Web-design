// js/views/profileView.js

import {
  $,
  showView,
  setText,
  escapeHtml
} from "./baseView.js";

export function renderProfileView({
  user,
  profileStats,
  completedPolls,
  onOpenPoll,
  onOpenResults,
  onResetStats
}) {
  showView("viewProfile");

  setText(
    "profileMeta",
    `user: ${user.email} • created: ${new Date(user.createdAt).toLocaleDateString()}`
  );

  setText("pName", user.name || "—");
  setText("pEmail", user.email || "—");
  setText("pGender", user.gender || "—");
  setText("pDob", user.dob || "—");

  setText("kCompleted", String(profileStats.completedCount ?? 0));
  setText("kVotesCast", String(profileStats.votesCast ?? 0));
  setText("kTopTopic", profileStats.topTopic || "—");
  setText("kCompletionPct", `${profileStats.completionPct ?? 0}%`);

  renderCompletedPolls(completedPolls, onOpenPoll, onOpenResults);

  $("#btnResetMyStats")?.addEventListener("click", onResetStats);
}

function renderCompletedPolls(completedPolls, onOpenPoll, onOpenResults) {
  const list = $("#doneList");
  const hint = $("#doneHint");

  if (!list || !hint) return;

  list.innerHTML = "";

  if (!completedPolls?.length) {
    hint.style.display = "block";
    return;
  }

  hint.style.display = "none";

  completedPolls.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <div class="t">${escapeHtml(item.title)}</div>
        <div class="m">
          <span class="tagPill">${escapeHtml(item.topic)}</span>
          &nbsp; id: ${escapeHtml(item.id)} • ${escapeHtml(item.completedAt)}
        </div>
      </div>
      <div class="right">
        <button class="btn small ghost" data-action="open">Відкрити</button>
        <button class="btn small ghost" data-action="results">Результати</button>
      </div>
    `;

    div.querySelector('[data-action="open"]')?.addEventListener("click", () => {
      onOpenPoll?.(item.id);
    });

    div.querySelector('[data-action="results"]')?.addEventListener("click", () => {
      onOpenResults?.(item.id);
    });

    list.appendChild(div);
  });
}