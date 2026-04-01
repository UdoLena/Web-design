// js/controllers/profileController.js

import { dbLoad } from "../models/db.js";
import { getCurrentUser, resetCurrentUserStats } from "../models/authModel.js";
import { renderProfileView } from "../views/profileView.js";
import { applyNavState } from "./navController.js";
import { requireAuth } from "./authGuard.js";
import { navigateTo } from "./routerController.js";

export function showProfilePage() {
  const user = requireAuth();
  if (!user) return;

  applyNavState();

  const db = dbLoad();
  const freshUser = getCurrentUser();

  const completed = freshUser?.stats?.completed || [];
  const votesCast = freshUser?.stats?.votesCast || 0;

  const topicCounter = new Map();

  completed.forEach((item) => {
    const poll = db.polls.find((p) => p.id === item.pollId);
    if (!poll) return;
    topicCounter.set(poll.topic, (topicCounter.get(poll.topic) || 0) + 1);
  });

  const topTopic =
    [...topicCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const completionPct = db.polls.length
    ? Math.round((completed.length / db.polls.length) * 100)
    : 0;

  const completedPolls = completed
    .slice(0, 30)
    .map((item) => {
      const poll = db.polls.find((p) => p.id === item.pollId);
      if (!poll) return null;

      return {
        id: poll.id,
        title: poll.title,
        topic: poll.topic,
        completedAt: new Date(item.at).toLocaleString()
      };
    })
    .filter(Boolean);

  renderProfileView({
    user: freshUser,
    profileStats: {
      completedCount: completed.length,
      votesCast,
      topTopic,
      completionPct
    },
    completedPolls,
    onOpenPoll: (id) => navigateTo(`#poll=${id}`),
    onOpenResults: (id) => navigateTo(`#results=${id}`),
    onResetStats: handleResetStats
  });
}

function handleResetStats() {
  const confirmed = confirm("Скинути твою статистику (пройдені опитування)?");
  if (!confirmed) return;

  try {
    resetCurrentUserStats();
    showProfilePage();
  } catch (error) {
    alert(error.message);
  }
}