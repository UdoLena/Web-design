// js/controllers/pollController.js

import { getCurrentUser } from "../models/authModel.js";
import { deletePoll, getPollById, hasUserVoted, recordVote } from "../models/pollModel.js";
import { renderPollView, showVoteBanner } from "../views/pollView.js";
import { applyNavState } from "./navController.js";
import { navigateTo } from "./routerController.js";

export function showPollPage(id) {
  applyNavState();

  const poll = getPollById(id);

  if (!poll) {
    navigateTo("#home");
    return;
  }

  const currentUser = getCurrentUser();
  const voted = currentUser ? hasUserVoted(currentUser, poll.id) : false;

  renderPollView({
    poll,
    currentUser,
    hasVoted: voted,
    onVote: handleVote,
    onBack: () => navigateTo("#home"),
    onOpenResults: (pollId) => navigateTo(`#results=${pollId}`),
    onDelete: handleDeletePoll,
    onCopy: handleCopyLink
  });
}

function handleVote(pollId, selections) {
  try {
    recordVote(pollId, selections);
    showVoteBanner("✅ Голос зараховано.");

    setTimeout(() => {
      navigateTo(`#results=${pollId}`);
    }, 300);
  } catch (error) {
    showVoteBanner(`❌ ${error.message}`);
  }
}

function handleDeletePoll(pollId) {
  const confirmed = confirm("Видалити це опитування?");
  if (!confirmed) return;

  deletePoll(pollId);
  navigateTo("#home");
}

function handleCopyLink(pollId) {
  const link = `${location.origin}${location.pathname}#poll=${pollId}`;

  navigator.clipboard.writeText(link)
    .then(() => showVoteBanner("🔗 Посилання скопійовано."))
    .catch(() => showVoteBanner("❌ Не вдалося скопіювати посилання."));
}