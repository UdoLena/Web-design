// js/views/resultsView.js

import { $, showView, setText, escapeHtml } from "./baseView.js";

export function renderResultsView({
  poll,
  onBackToPoll,
  onBackHome
}) {
  showView("viewResults");

  setText(
    "resMeta",
    `topic: ${poll.topic} • id: ${poll.id} • votes: ${poll.totalVotes || 0}`
  );
  setText("resTitle", poll.title);

  renderBars(poll);

  $("#btnBackToPoll")?.addEventListener("click", () => onBackToPoll?.(poll.id));
  $("#btnBackHome2")?.addEventListener("click", onBackHome);
}

function renderBars(poll) {
  const container = $("#resBars");
  if (!container) return;

  container.innerHTML = "";

  const total = poll.totalVotes || 0;

  poll.options.forEach((option) => {
    const percent = total ? Math.round((option.votes / total) * 100) : 0;

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.innerHTML = `
      <div class="barTop">
        <strong>${escapeHtml(option.text)}</strong>
        <span>${option.votes} голосів • ${percent}%</span>
      </div>
      <div class="track">
        <div class="fill" style="width:${percent}%"></div>
      </div>
    `;

    container.appendChild(bar);
  });
}