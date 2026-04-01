// js/controllers/openController.js

import { getPollById } from "../models/pollModel.js";
import { renderOpenView, showOpenError } from "../views/openView.js";
import { applyNavState } from "./navController.js";
import { navigateTo } from "./routerController.js";

export function showOpenPage() {
  applyNavState();

  renderOpenView({
    onOpen: handleOpenPoll,
    onBack: () => navigateTo("#home")
  });
}

function handleOpenPoll(value) {
  if (!value) {
    showOpenError("Введи ID або посилання.");
    return;
  }

  const match = value.match(/poll=([a-f0-9]+)/i);
  const id = match?.[1] || value.replace(/[^a-f0-9]/gi, "");

  if (!id) {
    showOpenError("Не можу знайти ID в цьому рядку.");
    return;
  }

  const poll = getPollById(id);

  if (!poll) {
    showOpenError("Опитування з таким ID не знайдено.");
    return;
  }

  navigateTo(`#poll=${id}`);
}