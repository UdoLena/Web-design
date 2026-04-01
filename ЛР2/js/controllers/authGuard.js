// js/controllers/authGuard.js

import { getCurrentUser } from "../models/authModel.js";
import { navigateTo } from "./routerController.js";

export function requireAuth() {
  const user = getCurrentUser();

  if (user) {
    return user;
  }

  const returnHash = location.hash || "#home";
  localStorage.setItem("pulse_return", returnHash);
  navigateTo("#auth");
  return null;
}