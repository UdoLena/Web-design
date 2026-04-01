// js/controllers/authController.js

import { login, registerUser } from "../models/authModel.js";
import {
  renderAuthView,
  showLoginErrors,
  showRegisterErrors,
  showLoginBanner,
  showRegisterBanner
} from "../views/authView.js";
import { applyNavState } from "./navController.js";
import { navigateTo } from "./routerController.js";

export function showAuthPage() {
  applyNavState();

  renderAuthView({
    defaultTab: "login",
    onLoginSubmit: handleLoginSubmit,
    onRegisterSubmit: handleRegisterSubmit
  });
}

function handleLoginSubmit({ email, password }) {
  const errors = {
    email: "",
    password: ""
  };

  if (!email) {
    errors.email = "Введи email.";
  }

  if (!password) {
    errors.password = "Введи пароль.";
  }

  if (errors.email || errors.password) {
    showLoginErrors(errors);
    return;
  }

  try {
    login(email, password);
    applyNavState();
    showLoginBanner("✅ Успішний вхід!");

    const returnHash = localStorage.getItem("pulse_return");
    localStorage.removeItem("pulse_return");

    setTimeout(() => {
      navigateTo(returnHash || "#profile");
    }, 300);
  } catch (error) {
    showLoginBanner(`❌ ${error.message}`);
  }
}

function handleRegisterSubmit({ name, email, password, dob, gender }) {
  const errors = {
    name: "",
    email: "",
    password: ""
  };

  if (!name || name.trim().length < 2) {
    errors.name = "Ім’я мінімум 2 символи.";
  }

  if (!email) {
    errors.email = "Введи email.";
  }

  if (!password || password.length < 4) {
    errors.password = "Пароль мінімум 4 символи.";
  }

  if (errors.name || errors.email || errors.password) {
    showRegisterErrors(errors);
    return;
  }

  try {
    registerUser({ name, email, password, dob, gender });
    login(email, password);

    applyNavState();
    showRegisterBanner("✅ Акаунт створено! Вхід виконано.");

    const returnHash = localStorage.getItem("pulse_return");
    localStorage.removeItem("pulse_return");

    setTimeout(() => {
      navigateTo(returnHash || "#profile");
    }, 300);
  } catch (error) {
    showRegisterBanner(`❌ ${error.message}`);
  }
}