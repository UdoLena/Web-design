// js/views/baseView.js

export const VIEW_IDS = [
  "viewHome",
  "viewCreate",
  "viewOpen",
  "viewPoll",
  "viewResults",
  "viewAbout",
  "viewAuth",
  "viewProfile"
];

export function $(selector) {
  return document.querySelector(selector);
}

export function showView(viewId) {
  VIEW_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === viewId ? "block" : "none";
    }
  });
}

export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text ?? "";
  }
}

export function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = html ?? "";
  }
}

export function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value ?? "";
  }
}

export function showElement(id, visible = true, display = "block") {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = visible ? display : "none";
  }
}

export function setBanner(id, message) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!message) {
    el.style.display = "none";
    el.textContent = "";
    return;
  }

  el.style.display = "block";
  el.textContent = message;
}

export function setError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message || "";
  }
}

export function clearErrors(ids = []) {
  ids.forEach((id) => setError(id, ""));
}

export function clearBanners(ids = []) {
  ids.forEach((id) => setBanner(id, ""));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}