// js/views/createView.js

import {
  $,
  showView,
  setError,
  setBanner,
  clearErrors,
  escapeHtml
} from "./baseView.js";

export function renderCreateView({
  topics = [],
  defaultTopic = "Інше",
  onSubmit,
  onCancel
}) {
  showView("viewCreate");

  clearErrors(["errTopic", "errTitle", "errOpts"]);
  setBanner("createBanner", "");

  setupTopicSelect(topics, defaultTopic);
  setupOptions();

  const form = $("#createForm");
  if (form) {
    form.onsubmit = (event) => {
      event.preventDefault();

      clearErrors(["errTopic", "errTitle", "errOpts"]);
      setBanner("createBanner", "");

      const topicSelect = $("#topicSelect");
      const topicCustom = $("#topicCustom");
      const qTitle = $("#qTitle");
      const multi = $("#multi");
      const anon = $("#anon");
      const optionInputs = [...document.querySelectorAll("#opts input")];

      const topic =
        topicSelect?.value === "Інше"
          ? (topicCustom?.value || "").trim()
          : (topicSelect?.value || "").trim();

      const title = (qTitle?.value || "").trim();
      const options = optionInputs
        .map((input) => input.value.trim())
        .filter(Boolean);

      onSubmit?.({
        topic,
        title,
        options,
        multi: !!multi?.checked,
        anon: !!anon?.checked
      });
    };
  }

  const cancelBtn = document.querySelector('#viewCreate button[onclick="location.hash=\'#home\'"]');
  if (cancelBtn) {
    cancelBtn.onclick = onCancel;
  }
}

function setupTopicSelect(topics, defaultTopic) {
  const select = $("#topicSelect");
  const custom = $("#topicCustom");

  if (!select || !custom) return;

  select.innerHTML = "";

  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    select.appendChild(option);
  });

  select.value = defaultTopic;
  custom.value = "";
  custom.style.display = defaultTopic === "Інше" ? "block" : "none";

  select.onchange = () => {
    custom.style.display = select.value === "Інше" ? "block" : "none";
    if (select.value !== "Інше") {
      custom.value = "";
    }
  };
}

function setupOptions() {
  const opts = $("#opts");
  const addBtn = $("#btnAddOpt");

  if (!opts || !addBtn) return;

  opts.innerHTML = "";

  addOptionRow();
  addOptionRow();
  addOptionRow();

  addBtn.onclick = () => {
    const count = opts.querySelectorAll(".opt").length;
    if (count >= 10) {
      setBanner("createBanner", "Максимум 10 варіантів.");
      return;
    }

    addOptionRow();
  };

  function addOptionRow(value = "") {
    const row = document.createElement("div");
    row.className = "opt";
    row.innerHTML = `
      <input class="input" placeholder="Варіант відповіді..." maxlength="60" value="${escapeHtml(value)}" />
      <button type="button" class="x" title="видалити">✕</button>
    `;

    const removeBtn = row.querySelector(".x");
    if (removeBtn) {
      removeBtn.onclick = () => row.remove();
    }

    opts.appendChild(row);
  }
}

export function showCreateErrors({ topic, title, options }) {
  setError("errTopic", topic || "");
  setError("errTitle", title || "");
  setError("errOpts", options || "");
}

export function showCreateBanner(message) {
  setBanner("createBanner", message);
}