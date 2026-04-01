// js/app.js

import { seedIfEmpty } from "./models/seedModel.js";
import { initNav } from "./controllers/navController.js";
import { initRouter } from "./controllers/routerController.js";

import { showView } from "./views/baseView.js";

document.addEventListener("DOMContentLoaded", () => {
  showView("viewHome");
});

function initApp() {
  seedIfEmpty();
  initNav();
  initRouter();
}

document.addEventListener("DOMContentLoaded", initApp);