// js/controllers/resultsController.js

import { getPollById } from "../models/pollModel.js";
import { renderResultsView } from "../views/resultsView.js";
import { applyNavState } from "./navController.js";
import { navigateTo } from "./routerController.js";

export function showResultsPage(id) {
  applyNavState();

  const poll = getPollById(id);

  if (!poll) {
    navigateTo("#home");
    return;
  }

  renderResultsView({
    poll,
    onBackToPoll: (pollId) => navigateTo(`#poll=${pollId}`),
    onBackHome: () => navigateTo("#home")
  });
}