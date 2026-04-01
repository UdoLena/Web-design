// js/views/authView.js

import {
  $,
  showView,
  setError,
  setBanner,
  clearErrors,
  clearBanners
} from "./baseView.js";

export function renderAuthView({
  onLoginSubmit,
  onRegisterSubmit,
  defaultTab = "login"
}) {
  showView("viewAuth");

  clearErrors([
    "errLoginEmail",
    "errLoginPass",
    "errRegName",
    "errRegEmail",
    "errRegPass"
  ]);

  clearBanners(["loginBanner", "regBanner"]);

  const tabLogin = $("#tabLogin");
  const tabRegister = $("#tabRegister");
  const loginPanel = $("#loginPanel");
  const registerPanel = $("#registerPanel");

  function setTab(tab) {
    if (!loginPanel || !registerPanel) return;

    loginPanel.style.display = tab === "login" ? "block" : "none";
    registerPanel.style.display = tab === "register" ? "block" : "none";
  }

  tabLogin?.addEventListener("click", () => setTab("login"));
  tabRegister?.addEventListener("click", () => setTab("register"));
  setTab(defaultTab);

  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.onsubmit = (event) => {
      event.preventDefault();

      clearErrors(["errLoginEmail", "errLoginPass"]);
      setBanner("loginBanner", "");

      onLoginSubmit?.({
        email: ($("#loginEmail")?.value || "").trim().toLowerCase(),
        password: $("#loginPass")?.value || ""
      });
    };
  }

  const regForm = $("#regForm");
  if (regForm) {
    regForm.onsubmit = (event) => {
      event.preventDefault();

      clearErrors(["errRegName", "errRegEmail", "errRegPass"]);
      setBanner("regBanner", "");

      onRegisterSubmit?.({
        name: ($("#regName")?.value || "").trim(),
        email: ($("#regEmail")?.value || "").trim().toLowerCase(),
        password: $("#regPass")?.value || "",
        dob: $("#regDob")?.value || "",
        gender:
          document.querySelector("input[name=gender]:checked")?.value || "Інше"
      });
    };
  }
}

export function showLoginErrors({ email, password }) {
  setError("errLoginEmail", email || "");
  setError("errLoginPass", password || "");
}

export function showRegisterErrors({ name, email, password }) {
  setError("errRegName", name || "");
  setError("errRegEmail", email || "");
  setError("errRegPass", password || "");
}

export function showLoginBanner(message) {
  setBanner("loginBanner", message);
}

export function showRegisterBanner(message) {
  setBanner("regBanner", message);
}