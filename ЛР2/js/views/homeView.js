// js/views/homeView.js

import {
  $,
  showView,
  setText,
  showElement,
  escapeHtml
} from "./baseView.js";

export function renderHomeView({
  stats,
  topics,
  selectedTopic,
  polls,
  completedPollIds = [],
  onOpenPoll,
  onOpenResults,
  onFilterChange,
  onCreateClick,
  onSeedMoreClick
}) {
  showView("viewHome");

  setText("statPolls", String(stats.pollsCount ?? 0));
  setText("statVotes", String(stats.votesCount ?? 0));
  setText("statUsers", String(stats.usersCount ?? 0));

  renderTopicFilter(topics, selectedTopic, onFilterChange);
  renderPollList(polls, completedPollIds, onOpenPoll, onOpenResults);

  const btnCreate = document.querySelector("#viewHome .btn[onclick=\"location.hash='#create'\"]");
  if (btnCreate) {
    btnCreate.onclick = onCreateClick;
  }

  const seedBtn = $("#btnSeedAgain");
  if (seedBtn) {
    seedBtn.style.display = "inline-flex";
    seedBtn.textContent = "+ Demo";
    seedBtn.onclick = onSeedMoreClick;
  }
}

function renderTopicFilter(topics, selectedTopic, onFilterChange) {
  const select = $("#topicFilter");
  if (!select) return;

  select.innerHTML = "";

  ["Усі", ...(topics || [])].forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    if (topic === selectedTopic) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.onchange = () => {
    if (typeof onFilterChange === "function") {
      onFilterChange(select.value);
    }
  };
}

function renderPollList(polls, completedPollIds, onOpenPoll, onOpenResults) {
  const list = $("#pollList");
  const emptyHint = $("#emptyHint");

  if (!list || !emptyHint) return;

  list.innerHTML = "";

  if (!polls || !polls.length) {
    emptyHint.style.display = "block";
    return;
  }

  emptyHint.style.display = "none";

  const completedSet = new Set(completedPollIds);

  polls.forEach((poll) => {
    const isDone = completedSet.has(poll.id);

    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
      <div>
        <div class="t">${escapeHtml(poll.title)}</div>
        <div class="m">
          <span class="tagPill">${escapeHtml(poll.topic)}</span>
          &nbsp; id: ${escapeHtml(poll.id)} • votes: ${poll.totalVotes || 0} • ${poll.multi ? "multi" : "single"}
          ${isDone ? " • ✅ пройдено" : ""}
        </div>
      </div>
      <div class="right">
        <button class="btn small ghost" data-action="open">Відкрити</button>
        <button class="btn small ghost" data-action="results">Результати</button>
      </div>
    `;

    const openBtn = card.querySelector('[data-action="open"]');
    const resultsBtn = card.querySelector('[data-action="results"]');

    if (openBtn) {
      openBtn.addEventListener("click", () => onOpenPoll?.(poll.id));
    }

    if (resultsBtn) {
      resultsBtn.addEventListener("click", () => onOpenResults?.(poll.id));
    }

    list.appendChild(card);
  });
}