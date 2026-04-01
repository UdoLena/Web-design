// js/controllers/routerController.js

import { showHomePage } from "./homeController.js";
import { showCreatePage } from "./createController.js";
import { showOpenPage } from "./openController.js";
import { showAuthPage } from "./authController.js";
import { showProfilePage } from "./profileController.js";
import { showPollPage } from "./pollController.js";
import { showResultsPage } from "./resultsController.js";
import { showAboutPage } from "./aboutController.js";

export function parseHash() {
  const hash = (location.hash || "#home").replace("#", "");

  if (hash.startsWith("poll=")) {
    return {
      view: "poll",
      id: hash.split("poll=")[1]
    };
  }

  if (hash.startsWith("results=")) {
    return {
      view: "results",
      id: hash.split("results=")[1]
    };
  }

  if (hash === "create") return { view: "create" };
  if (hash === "open") return { view: "open" };
  if (hash === "auth") return { view: "auth" };
  if (hash === "profile") return { view: "profile" };
  if (hash === "about") return { view: "about" };

  return { view: "home" };
}

export function navigateTo(hash) {
  location.hash = hash;
}

export function handleRoute() {
  const route = parseHash();

  switch (route.view) {
    case "create":
      showCreatePage();
      break;
    case "open":
      showOpenPage();
      break;
    case "auth":
      showAuthPage();
      break;
    case "profile":
      showProfilePage();
      break;
    case "poll":
      showPollPage(route.id);
      break;
    case "results":
      showResultsPage(route.id);
      break;
    case "about":
      showAboutPage();
      break;
    case "home":
    default:
      showHomePage();
      break;
  }
}

export function initRouter() {
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}