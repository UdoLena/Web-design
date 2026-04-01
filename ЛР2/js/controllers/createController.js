// js/controllers/createController.js

import { TOPICS } from "../models/db.js";
import { createPoll } from "../models/pollModel.js";
import { renderCreateView, showCreateBanner, showCreateErrors } from "../views/createView.js";
import { applyNavState } from "./navController.js";
import { requireAuth } from "./authGuard.js";
import { navigateTo } from "./routerController.js";

export function showCreatePage() {
  const user = requireAuth();
  if (!user) return;

  applyNavState();

  renderCreateView({
    topics: TOPICS,
    defaultTopic: "Інше",
    onSubmit: handleCreateSubmit,
    onCancel: () => navigateTo("#home")
  });
}

function handleCreateSubmit(formData) {
  const errors = validateCreateForm(formData);

  if (errors.topic || errors.title || errors.options) {
    showCreateErrors(errors);
    return;
  }

  try {
    const poll = createPoll(formData);
    showCreateBanner(`✅ Створено! ID: ${poll.id}. Відкриваю...`);

    setTimeout(() => {
      navigateTo(`#poll=${poll.id}`);
    }, 400);
  } catch (error) {
    showCreateBanner(`❌ ${error.message}`);
  }
}

function validateCreateForm({ topic, title, options }) {
  const result = {
    topic: "",
    title: "",
    options: ""
  };

  if (!topic || topic.trim().length < 2) {
    result.topic = "Вкажи тему (мінімум 2 символи).";
  }

  if (!title || title.trim().length < 5) {
    result.title = "Питання має бути мінімум 5 символів.";
  }

  if (!options || options.length < 2) {
    result.options = "Потрібно мінімум 2 варіанти.";
    return result;
  }

  const normalized = options.map((item) => item.trim().toLowerCase());
  const unique = new Set(normalized);

  if (unique.size !== normalized.length) {
    result.options = "Варіанти повинні бути унікальні.";
  }

  return result;
}