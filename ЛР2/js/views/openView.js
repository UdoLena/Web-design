// js/views/openView.js

import { $, showView, setError } from "./baseView.js";

export function renderOpenView({ onOpen, onBack }) {
  showView("viewOpen");
  setError("errOpen", "");

  const button = $("#btnOpenGo");
  const input = $("#openInput");

  if (button) {
    button.onclick = () => {
      setError("errOpen", "");
      const value = (input?.value || "").trim();
      onOpen?.(value);
    };
  }

  const backBtn = document.querySelector('#viewOpen button[onclick="location.hash=\'#home\'"]');
  if (backBtn) {
    backBtn.onclick = onBack;
  }
}

export function showOpenError(message) {
  setError("errOpen", message);
}