// js/controllers/homeController.js

import { getAllPolls, getPollStats, getTopicsFromPolls } from "../models/pollModel.js";
import { getCurrentUser } from "../models/authModel.js";
import { seedMore } from "../models/seedModel.js";
import { renderHomeView } from "../views/homeView.js";
import { applyNavState } from "./navController.js";
import { navigateTo } from "./routerController.js";

export function showHomePage() {
  applyNavState();

  const stats = getPollStats();
  const topics = getTopicsFromPolls();
  const allPolls = getAllPolls();
  const currentUser = getCurrentUser();

  const selectedTopic = localStorage.getItem("pulse_topic_filter") || "Усі";

  const filteredPolls =
    selectedTopic === "Усі"
      ? allPolls
      : allPolls.filter((poll) => poll.topic === selectedTopic);

  const completedPollIds = currentUser?.stats?.completed?.map((item) => item.pollId) || [];

  renderHomeView({
    stats,
    topics,
    selectedTopic,
    polls: filteredPolls,
    completedPollIds,
    onOpenPoll: (id) => navigateTo(`#poll=${id}`),
    onOpenResults: (id) => navigateTo(`#results=${id}`),
    onFilterChange: (topic) => {
      localStorage.setItem("pulse_topic_filter", topic);
      showHomePage();
    },
    onCreateClick: () => navigateTo("#create"),
    onSeedMoreClick: () => {
      seedMore();
      showHomePage();
    }
  });
}