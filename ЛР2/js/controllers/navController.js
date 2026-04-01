// js/controllers/navController.js

import { getCurrentUser, logout } from "../models/authModel.js";
import { $ } from "../views/baseView.js";
import { navigateTo } from "./routerController.js";

export function applyNavState() {
  const user = getCurrentUser();

  const navAuth = $("#navAuth");
  const navLogout = $("#navLogout");

  if (navAuth) {
    navAuth.textContent = user ? "Акаунт" : "Вхід/Реєстрація";
  }

  if (navLogout) {
    navLogout.style.display = user ? "inline-flex" : "none";
  }
}

export function initNav() {
  $("#navHome")?.addEventListener("click", () => navigateTo("#home"));
  $("#navCreate")?.addEventListener("click", () => navigateTo("#create"));
  $("#navOpen")?.addEventListener("click", () => navigateTo("#open"));
  $("#navAbout")?.addEventListener("click", () => navigateTo("#about"));

  $("#navAuth")?.addEventListener("click", () => {
    const user = getCurrentUser();
    navigateTo(user ? "#profile" : "#auth");
  });

  $("#navLogout")?.addEventListener("click", () => {
    logout();
    applyNavState();
    navigateTo("#home");
  });

  applyNavState();
}