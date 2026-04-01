// js/views/pollView.js

import {
  $,
  showView,
  setText,
  setBanner,
  escapeHtml
} from "./baseView.js";

export function renderPollView({
  poll,
  currentUser,
  hasVoted,
  onVote,
  onBack,
  onOpenResults,
  onDelete,
  onCopy
}) {
  showView("viewPoll");
  setBanner("voteBanner", "");

  setText(
    "pollMeta",
    `topic: ${poll.topic} • id: ${poll.id} • ${poll.multi ? "multi" : "single"} • votes: ${poll.totalVotes || 0}`
  );

  setText("pollTitle", poll.title);

  if (!currentUser) {
    setText(
      "pollSub",
      "❌ Реєстрація/вхід не пройдені. Увійди або зареєструйся, щоб пройти опитування."
    );
  } else if (hasVoted) {
    setText("pollSub", "✅ Ти вже проходив це опитування.");
  } else {
    setText(
      "pollSub",
      poll.multi
        ? "Можна обрати кілька варіантів."
        : "Можна обрати лише один варіант."
    );
  }

  renderVoteOptions(poll);

  const btnVote = $("#btnVote");
  if (btnVote) {
    btnVote.onclick = () => {
      const selected = getSelectedOptionIds();
      onVote?.(poll.id, selected);
    };
  }

  $("#btnBackFromPoll")?.addEventListener("click", onBack);
  $("#btnGoResults")?.addEventListener("click", () => onOpenResults?.(poll.id));
  $("#btnDeletePoll")?.addEventListener("click", () => onDelete?.(poll.id));
  $("#btnCopy")?.addEventListener("click", () => onCopy?.(poll.id));

  const shareLink = document.getElementById("shareLink");
  if (shareLink) {
    shareLink.textContent = `${location.origin}${location.pathname}#poll=${poll.id}`;
  }
}

function renderVoteOptions(poll) {
  const container = $("#voteOptions");
  if (!container) return;

  container.innerHTML = "";

  poll.options.forEach((option) => {
    const type = poll.multi ? "checkbox" : "radio";

    const row = document.createElement("label");
    row.className = "choice";
    row.innerHTML = `
      <input type="${type}" name="voteOption" value="${escapeHtml(option.id)}" />
      <span>${escapeHtml(option.text)}</span>
    `;

    container.appendChild(row);
  });
}

function getSelectedOptionIds() {
  return [...document.querySelectorAll("#voteOptions input:checked")].map(
    (input) => input.value
  );
}

export function showVoteBanner(message) {
  setBanner("voteBanner", message);
}