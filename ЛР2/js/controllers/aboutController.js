// js/controllers/aboutController.js

import { renderAboutView } from "../views/aboutView.js";
import { applyNavState } from "./navController.js";

export function showAboutPage() {
  applyNavState();
  renderAboutView();
}