// ===================== Local DB =====================
const DB_KEY = "pulse_survey_db_v2";

const TOPICS = [
  "Їжа", "Кіно/Серіали", "Музика", "Ігри", "Технології", "Навчання",
  "Подорожі", "Спорт", "Психологія", "Стиль життя", "Інше"
];

function dbLoad() {
  try {
    const v = JSON.parse(localStorage.getItem(DB_KEY));
    return v ?? { polls: [], users: [], sessions: { current: null } };
  } catch {
    return { polls: [], users: [], sessions: { current: null } };
  }
}
function dbSave(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function uid() {
  return Math.random().toString(16).slice(2, 8) + Math.random().toString(16).slice(2, 4);
}
function nowISO() { return new Date().toISOString(); }

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function clip(text, max=120) {
  return (text || "").trim().replace(/\s+/g, " ").slice(0, max);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ===================== Router =====================
function parseHash() {
  const h = (location.hash || "#home").replace("#", "");
  if (h.startsWith("poll=")) return { view: "poll", id: h.split("poll=")[1] };
  if (h.startsWith("results=")) return { view: "results", id: h.split("results=")[1] };
  if (h === "create") return { view: "create" };
  if (h === "open") return { view: "open" };
  if (h === "auth") return { view: "auth" };
  if (h === "profile") return { view: "profile" };
  if (h === "about") return { view: "about" };
  return { view: "home" };
}

const $ = (s) => document.querySelector(s);

function show(viewId) {
  ["viewHome","viewCreate","viewOpen","viewPoll","viewResults","viewAbout","viewAuth","viewProfile"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === viewId ? "block" : "none");
  });
}

function setBanner(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!msg) { el.style.display = "none"; el.textContent = ""; }
  else { el.style.display = "block"; el.textContent = msg; }
}
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || "";
}

// ===================== Auth & Session =====================
function currentUser() {
  const db = dbLoad();
  const email = db.sessions?.current?.email ?? null;
  if (!email) return null;
  return db.users.find(u => u.email === email) ?? null;
}
function requireAuthOrRedirect() {
  if (currentUser()) return true;
  // запомнить куда хотели попасть
  const ret = location.hash || "#home";
  localStorage.setItem("pulse_return", ret);
  location.hash = "#auth";
  return false;
}
function applyAuthUI() {
  const u = currentUser();
  const navAuth = $("#navAuth");
  const navLogout = $("#navLogout");

  if (u) {
    navAuth.textContent = "Акаунт";
    navLogout.style.display = "inline-flex";
  } else {
    navAuth.textContent = "Вхід/Реєстрація";
    navLogout.style.display = "none";
  }
}

function login(email, pass) {
  const db = dbLoad();
  const u = db.users.find(x => x.email === email && x.password === pass);
  if (!u) throw new Error("Невірний email або пароль.");
  db.sessions.current = { email: u.email, at: nowISO() };
  dbSave(db);
}
function registerUser({ name, email, password, gender, dob }) {
  const db = dbLoad();
  if (db.users.some(u => u.email === email)) throw new Error("Користувач з таким email вже існує.");
  db.users.push({
    id: uid(),
    name,
    email,
    password,
    gender,
    dob,
    createdAt: nowISO(),
    stats: {
      votesCast: 0,
      completed: [] // {pollId, at, selections:[optId]}
    }
  });
  dbSave(db);
}
function logout() {
  const db = dbLoad();
  db.sessions.current = null;
  dbSave(db);
  location.hash = "#home";
}

// ===================== Poll operations =====================
function getPoll(id) {
  const db = dbLoad();
  return db.polls.find(p => p.id === id) ?? null;
}
function createPoll({ title, options, multi, anon, topic }) {
  const db = dbLoad();
  const poll = {
    id: uid(),
    createdAt: nowISO(),
    title: clip(title, 120),
    topic: clip(topic, 40) || "Інше",
    multi: !!multi,
    anon: !!anon,
    options: options.map(t => ({ id: uid(), text: clip(t, 60), votes: 0 })),
    totalVotes: 0
  };
  db.polls.unshift(poll);
  dbSave(db);
  return poll.id;
}
function deletePoll(id) {
  const db = dbLoad();
  db.polls = db.polls.filter(p => p.id !== id);

  // прибрати зі статистики користувачів
  db.users.forEach(u => {
    u.stats.completed = (u.stats.completed || []).filter(c => c.pollId !== id);
  });

  dbSave(db);
}
function userHasVoted(user, pollId) {
  if (!user) return false;
  const c = user.stats?.completed ?? [];
  return c.some(x => x.pollId === pollId);
}
function recordVote(pollId, selections) {
  const db = dbLoad();
  const poll = db.polls.find(p => p.id === pollId);
  if (!poll) throw new Error("Опитування не знайдено.");

  const u = currentUser();
  if (!u) throw new Error("Потрібен вхід.");

  // знайти user в db
  const user = db.users.find(x => x.email === u.email);
  if (!user) throw new Error("Користувач не знайдений.");

  if (userHasVoted(user, pollId)) throw new Error("Ти вже проходив це опитування.");

  const valid = new Set(poll.options.map(o => o.id));
  const chosen = (selections || []).filter(id => valid.has(id));
  if (!chosen.length) throw new Error("Обери хоча б один варіант.");

  // update votes
  chosen.forEach(optId => {
    const o = poll.options.find(x => x.id === optId);
    if (o) o.votes += 1;
  });
  poll.totalVotes += 1;

  // record in profile stats
  user.stats.votesCast = (user.stats.votesCast || 0) + 1;
  user.stats.completed = user.stats.completed || [];
  user.stats.completed.unshift({ pollId, at: nowISO(), selections: chosen });

  dbSave(db);
}

// ===================== Seed demo polls =====================
function seedIfEmpty() {
  const db = dbLoad();
  if (db.polls.length) return;

  const demo = [
    { topic:"Їжа", title:"Який сніданок топ?", multi:false, opts:["Вівсянка","Яєчня","Сендвіч","Йогурт"] },
    { topic:"Їжа", title:"Піцца: найкраща начинка?", multi:true, opts:["Пепероні","Гриби","4 сири","Ананас","Овочі"] },
    { topic:"Кіно/Серіали", title:"Що більше любиш?", multi:false, opts:["Серіали","Фільми","Аніме","Документалки"] },
    { topic:"Кіно/Серіали", title:"Як дивишся серіали?", multi:false, opts:["По серії","Сезонами (binge)","Лише хайлайти","Рідко дивлюсь"] },
    { topic:"Музика", title:"Який жанр частіше слухаєш?", multi:true, opts:["Pop","Rap/Hip-Hop","Rock","EDM","Lo-fi","K-pop"] },
    { topic:"Музика", title:"Слухаєш музику під навчання?", multi:false, opts:["Так, завжди","Іноді","Ні, заважає"] },
    { topic:"Ігри", title:"Платформа для ігор?", multi:true, opts:["PC","PlayStation","Xbox","Mobile","Nintendo"] },
    { topic:"Ігри", title:"Що важливіше в грі?", multi:false, opts:["Сюжет","Графіка","Геймплей","Онлайн/друзі"] },
    { topic:"Технології", title:"Який браузер твій основний?", multi:false, opts:["Chrome","Edge","Firefox","Safari","Opera"] },
    { topic:"Технології", title:"Темна тема — це must?", multi:false, opts:["Так","Ні","Іноді"] },
    { topic:"Навчання", title:"Як ти готуєшся до пар?", multi:false, opts:["Конспект","Відео","Практика","Ніяк 😅"] },
    { topic:"Навчання", title:"Що найбільше прокачує навички?", multi:true, opts:["Практика/проекти","Теорія","Ментор","Команда/хакатони"] },
    { topic:"Подорожі", title:"Куди б поїхав зараз?", multi:false, opts:["Море","Гори","Європа-сіті","Дім ❤️"] },
    { topic:"Подорожі", title:"Що береш у подорож обов’язково?", multi:true, opts:["Пауербанк","Навушники","Аптечка","Фотоапарат","Книга"] },
    { topic:"Спорт", title:"Як часто спорт?", multi:false, opts:["3+ рази/тиждень","1-2 рази/тиждень","Рідко","Ніколи"] },
    { topic:"Психологія", title:"Що допомагає від стресу?", multi:true, opts:["Сон","Спорт","Музика","Прогулянка","Розмова з другом"] },
    { topic:"Стиль життя", title:"Ти більше…", multi:false, opts:["Ранкова людина","Нічна сова","Як вийде"] },
    { topic:"Стиль життя", title:"Кава чи чай?", multi:false, opts:["Кава","Чай","Не п’ю"] }
  ];

  demo.forEach(p => createPoll({
    title: p.title,
    topic: p.topic,
    multi: p.multi,
    anon: true,
    options: p.opts
  }));
}

// add extra demos when user clicks +Demo
function seedMore() {
  const extra = [
    { topic:"Технології", title:"Яка ОС основна?", multi:false, opts:["Windows","macOS","Linux","Інше"] },
    { topic:"Ігри", title:"Який жанр ігор топ?", multi:true, opts:["RPG","Shooter","Strategy","Indie","Sports","Survival"] },
    { topic:"Їжа", title:"Що вибереш на вечерю?", multi:false, opts:["Паста","Суші","Бургер","Салат"] },
    { topic:"Навчання", title:"Що складніше?", multi:false, opts:["Математика","Програмування","Англійська","Все норм"] }
  ];
  extra.forEach(p => createPoll({ title:p.title, topic:p.topic, multi:p.multi, anon:true, options:p.opts }));
}

// ===================== Views =====================

// HOME
function renderHome() {
  show("viewHome");
  setBanner("createBanner", "");
  applyAuthUI();

  const db = dbLoad();
  $("#statPolls").textContent = String(db.polls.length);
  $("#statVotes").textContent = String(db.polls.reduce((s,p)=>s+(p.totalVotes||0),0));
  $("#statUsers").textContent = String(db.users.length);

  // topic filter options
  const tf = $("#topicFilter");
  const topicsInDb = Array.from(new Set(db.polls.map(p=>p.topic))).sort((a,b)=>a.localeCompare(b));
  tf.innerHTML = "";
  ["Усі", ...topicsInDb].forEach(t => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    tf.appendChild(o);
  });

  const saved = localStorage.getItem("pulse_topic_filter") || "Усі";
  if ([...tf.options].some(o=>o.value===saved)) tf.value = saved;

  tf.onchange = () => {
    localStorage.setItem("pulse_topic_filter", tf.value);
    renderHome(); // refresh list
  };

  const filter = tf.value;
  const polls = filter === "Усі" ? db.polls : db.polls.filter(p => p.topic === filter);

  const list = $("#pollList");
  const empty = $("#emptyHint");
  list.innerHTML = "";

  if (!polls.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const u = currentUser();
  const completedSet = new Set((u?.stats?.completed || []).map(x=>x.pollId));

  polls.forEach(p => {
    const done = completedSet.has(p.id);
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <div class="t">${escapeHtml(p.title)}</div>
        <div class="m">
          <span class="tagPill">${escapeHtml(p.topic)}</span>
          &nbsp; id: ${p.id} • votes: ${p.totalVotes || 0} • ${p.multi ? "multi" : "single"}
          ${done ? " • ✅ пройдено" : ""}
        </div>
      </div>
      <div class="right">
        <button class="btn small ghost" data-open="${p.id}">Відкрити</button>
        <button class="btn small ghost" data-res="${p.id}">Результати</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll("[data-open]").forEach(btn=>{
    btn.addEventListener("click", ()=> location.hash = `#poll=${btn.dataset.open}`);
  });
  list.querySelectorAll("[data-res]").forEach(btn=>{
    btn.addEventListener("click", ()=> location.hash = `#results=${btn.dataset.res}`);
  });

  $("#btnSeedAgain").onclick = () => {
    seedMore();
    renderHome();
  };
  $("#btnSeedAgain").style.display = "inline-flex";
  $("#btnSeedAgain").textContent = "+ Demo";
}

// CREATE
function initCreate() {
  if (!requireAuthOrRedirect()) return;

  show("viewCreate");
  applyAuthUI();
  setErr("errTopic","");
  setErr("errTitle","");
  setErr("errOpts","");
  setBanner("createBanner","");

  // topics select
  const sel = $("#topicSelect");
  sel.innerHTML = "";
  TOPICS.forEach(t => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    sel.appendChild(o);
  });
  sel.value = "Інше";
  const custom = $("#topicCustom");
  custom.value = "";
  custom.style.display = "block";

  sel.onchange = () => {
    if (sel.value === "Інше") {
      custom.style.display = "block";
    } else {
      custom.style.display = "none";
      custom.value = "";
    }
  };

  const opts = $("#opts");
  opts.innerHTML = "";
  addOpt(); addOpt(); addOpt();

  $("#btnAddOpt").onclick = () => {
    if (opts.querySelectorAll(".opt").length >= 10) {
      setBanner("createBanner","Максимум 10 варіантів.");
      return;
    }
    addOpt();
  };

  $("#createForm").onsubmit = (e) => {
    e.preventDefault();
    setErr("errTopic","");
    setErr("errTitle","");
    setErr("errOpts","");
    setBanner("createBanner","");

    const topic = (sel.value === "Інше" ? custom.value.trim() : sel.value.trim());
    const title = $("#qTitle").value.trim();
    const multi = $("#multi").checked;
    const anon = $("#anon").checked;

    const values = [...opts.querySelectorAll("input")]
      .map(i => i.value.trim())
      .filter(v => v.length);

    if (!topic || topic.length < 2) { setErr("errTopic","Вкажи тему (мінімум 2 символи)."); return; }
    if (title.length < 5) { setErr("errTitle","Питання має бути мінімум 5 символів."); return; }
    if (values.length < 2) { setErr("errOpts","Потрібно мінімум 2 варіанти."); return; }

    const uniq = new Set(values.map(v => v.toLowerCase()));
    if (uniq.size !== values.length) { setErr("errOpts","Варіанти повинні бути унікальні."); return; }

    const id = createPoll({ title, topic, options: values, multi, anon });
    setBanner("createBanner", `✅ Створено! ID: ${id}. Відкриваю...`);
    setTimeout(()=> location.hash = `#poll=${id}`, 450);
  };

  function addOpt() {
    const row = document.createElement("div");
    row.className = "opt";
    row.innerHTML = `
      <input class="input" placeholder="Варіант відповіді..." maxlength="60" />
      <button type="button" class="x" title="видалити">✕</button>
    `;
    row.querySelector(".x").onclick = () => row.remove();
    opts.appendChild(row);
  }
}

// OPEN
function initOpen() {
  show("viewOpen");
  applyAuthUI();
  setErr("errOpen","");

  $("#btnOpenGo").onclick = () => {
    setErr("errOpen","");
    const v = ($("#openInput").value || "").trim();
    if (!v) { setErr("errOpen","Введи ID або посилання."); return; }

    const m1 = v.match(/poll=([a-f0-9]+)/i);
    const id = m1?.[1] || v.replace(/[^a-f0-9]/gi,"");

    if (!id) { setErr("errOpen","Не можу знайти ID в цьому рядку."); return; }
    if (!getPoll(id)) { setErr("errOpen","Опитування з таким ID не знайдено."); return; }

    location.hash = `#poll=${id}`;
  };
}

// AUTH
function initAuth() {
  show("viewAuth");
  applyAuthUI();

  // reset errors/banners
  ["errLoginEmail","errLoginPass","errRegName","errRegEmail","errRegPass"].forEach(id => setErr(id,""));
  setBanner("loginBanner","");
  setBanner("regBanner","");

  const tabLogin = $("#tabLogin");
  const tabRegister = $("#tabRegister");
  const loginPanel = $("#loginPanel");
  const registerPanel = $("#registerPanel");

  function setTab(which) {
    if (which === "login") {
      loginPanel.style.display = "block";
      registerPanel.style.display = "none";
    } else {
      loginPanel.style.display = "none";
      registerPanel.style.display = "block";
    }
  }

  tabLogin.onclick = () => setTab("login");
  tabRegister.onclick = () => setTab("register");

  // default tab
  setTab("login");

  $("#loginForm").onsubmit = (e) => {
    e.preventDefault();
    setErr("errLoginEmail","");
    setErr("errLoginPass","");
    setBanner("loginBanner","");

    const email = ($("#loginEmail").value || "").trim().toLowerCase();
    const pass = ($("#loginPass").value || "");

    if (!email) { setErr("errLoginEmail","Введи email."); return; }
    if (!isValidEmail(email)) { setErr("errLoginEmail","Невірний формат email."); return; }
    if (!pass) { setErr("errLoginPass","Введи пароль."); return; }

    try {
      login(email, pass);
      applyAuthUI();
      setBanner("loginBanner","✅ Успішний вхід!");

      const ret = localStorage.getItem("pulse_return");
      localStorage.removeItem("pulse_return");
      setTimeout(()=> location.hash = ret || "#profile", 350);
    } catch (err) {
      setBanner("loginBanner", "❌ " + err.message);
    }
  };

  $("#regForm").onsubmit = (e) => {
    e.preventDefault();
    setErr("errRegName","");
    setErr("errRegEmail","");
    setErr("errRegPass","");
    setBanner("regBanner","");

    const name = ($("#regName").value || "").trim();
    const email = ($("#regEmail").value || "").trim().toLowerCase();
    const pass = ($("#regPass").value || "");
    const dob = ($("#regDob").value || "");
    const gender = document.querySelector("input[name=gender]:checked")?.value || "Інше";

    if (name.length < 2) { setErr("errRegName","Ім’я мінімум 2 символи."); return; }
    if (!email) { setErr("errRegEmail","Введи email."); return; }
    if (!isValidEmail(email)) { setErr("errRegEmail","Невірний формат email."); return; }
    if (pass.length < 4) { setErr("errRegPass","Пароль мінімум 4 символи."); return; }

    try {
      registerUser({ name, email, password: pass, gender, dob });
      login(email, pass);
      applyAuthUI();
      setBanner("regBanner", "✅ Акаунт створено! Вхід виконано.");

      const ret = localStorage.getItem("pulse_return");
      localStorage.removeItem("pulse_return");
      setTimeout(()=> location.hash = ret || "#profile", 350);
    } catch (err) {
      setBanner("regBanner", "❌ " + err.message);
    }
  };
}

// PROFILE
function renderProfile() {
  if (!requireAuthOrRedirect()) return;

  show("viewProfile");
  applyAuthUI();

  const db = dbLoad();
  const u = currentUser();
  const user = db.users.find(x=>x.email===u.email);

  $("#profileMeta").textContent = `user: ${user.email} • created: ${new Date(user.createdAt).toLocaleDateString()}`;
  $("#pName").textContent = user.name || "—";
  $("#pEmail").textContent = user.email || "—";
  $("#pGender").textContent = user.gender || "—";
  $("#pDob").textContent = user.dob || "—";

  const completed = user.stats?.completed || [];
  const votesCast = user.stats?.votesCast || 0;
  $("#kCompleted").textContent = String(completed.length);
  $("#kVotesCast").textContent = String(votesCast);

  // top topic
  const topicCount = new Map();
  completed.forEach(c => {
    const p = db.polls.find(x=>x.id===c.pollId);
    if (!p) return;
    topicCount.set(p.topic, (topicCount.get(p.topic)||0)+1);
  });
  const top = [...topicCount.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
  $("#kTopTopic").textContent = top;

  const pct = db.polls.length ? Math.round((completed.length / db.polls.length) * 100) : 0;
  $("#kCompletionPct").textContent = `${pct}%`;

  // list done
  const list = $("#doneList");
  const hint = $("#doneHint");
  list.innerHTML = "";

  if (!completed.length) {
    hint.style.display = "block";
  } else {
    hint.style.display = "none";
    completed.slice(0, 30).forEach(c => {
      const p = db.polls.find(x=>x.id===c.pollId);
      if (!p) return;
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div>
          <div class="t">${escapeHtml(p.title)}</div>
          <div class="m">
            <span class="tagPill">${escapeHtml(p.topic)}</span>
            &nbsp; id: ${p.id} • ${new Date(c.at).toLocaleString()}
          </div>
        </div>
        <div class="right">
          <button class="btn small ghost" data-open="${p.id}">Відкрити</button>
          <button class="btn small ghost" data-res="${p.id}">Результати</button>
        </div>
      `;
      list.appendChild(div);
    });

    list.querySelectorAll("[data-open]").forEach(btn=>{
      btn.addEventListener("click", ()=> location.hash = `#poll=${btn.dataset.open}`);
    });
    list.querySelectorAll("[data-res]").forEach(btn=>{
      btn.addEventListener("click", ()=> location.hash = `#results=${btn.dataset.res}`);
    });
  }

  $("#btnResetMyStats").onclick = () => {
    if (!confirm("Скинути твою статистику (пройдені опитування)?")) return;
    const db2 = dbLoad();
    const me = db2.users.find(x=>x.email===u.email);
    me.stats = { votesCast: 0, completed: [] };
    dbSave(db2);
    renderProfile();
  };
}

// POLL (vote)
function renderPoll(id) {
  const poll = getPoll(id);
  if (!poll) { location.hash = "#home"; return; }

  show("viewPoll");
  applyAuthUI();
  setBanner("voteBanner","");

  const u = currentUser();
  const has = u ? userHasVoted(u, poll.id) : false;

  $("#pollMeta").textContent = `topic: ${poll.topic} • id: ${poll.id} • ${poll.multi ? "multi" : "single"} • votes: ${poll.totalVotes || 0}`;
  $("#pollTitle").textContent = poll.title;

  if (!u) {
    $("#pollSub").textContent = "❌ Реєстрація/вхід не пройдені. Увійди або зареєструйся, щоб пройти опитування.";
  } else if (has) {
    $("#pollSub").textContent = "✅ Ти вже проходив це опитування. Можеш подивитись результати.";
  } else {
    $("#pollSub").textContent = poll.multi
      ? "Можна вибрати кілька варіантів і натиснути “Голосувати”."
      : "Вибери один варіант і натисни “Голосувати”.";
  }

  $("#btnBackFromPoll").onclick = () => history.length ? history.back() : (location.hash="#home");

  const link = `${location.origin}${location.pathname}#poll=${poll.id}`;
  $("#shareLink").textContent = link;

  $("#btnCopy").onclick = async () => {
    try{
      await navigator.clipboard.writeText(link);
      setBanner("voteBanner","✅ Посилання скопійовано!");
      setTimeout(()=>setBanner("voteBanner",""), 900);
    }catch{
      setBanner("voteBanner","Не вдалося скопіювати. Скопіюй вручну.");
    }
  };

  $("#btnGoResults").onclick = () => location.hash = `#results=${poll.id}`;

  $("#btnDeletePoll").onclick = () => {
    if (!confirm("Видалити опитування назавжди?")) return;
    deletePoll(poll.id);
    location.hash = "#home";
  };

  // render options
  const box = $("#voteOptions");
  box.innerHTML = "";
  const inputType = poll.multi ? "checkbox" : "radio";

  poll.options.forEach(opt => {
    const div = document.createElement("label");
    div.className = "choice";
    div.innerHTML = `
      <input type="${inputType}" name="vote" value="${opt.id}" ${(!u || has) ? "disabled" : ""}>
      <div>
        <div style="font-weight:900">${escapeHtml(opt.text)}</div>
        <div style="color: rgba(255,247,249,.66); font-family: var(--mono); font-size:12px">
          votes: ${opt.votes}
        </div>
      </div>
    `;
    box.appendChild(div);
  });

  const btnVote = $("#btnVote");
  btnVote.disabled = (!u || has);

  btnVote.onclick = () => {
    if (!currentUser()) {
      setBanner("voteBanner","❌ Реєстрація/вхід не пройдені. Увійди або зареєструйся, щоб пройти опитування.");
      setTimeout(()=> location.hash = "#auth", 350);
      return;
    }

    const checked = [...box.querySelectorAll("input:checked")].map(i => i.value);
    try{
      recordVote(poll.id, checked);
      setBanner("voteBanner","✅ Голос зараховано! Дивись результати.");
      setTimeout(()=> location.hash = `#results=${poll.id}`, 450);
    }catch(err){
      setBanner("voteBanner","❌ " + err.message);
    }
  };
}

// RESULTS
function renderResults(id) {
  const poll = getPoll(id);
  if (!poll) { location.hash="#home"; return; }

  show("viewResults");
  applyAuthUI();

  $("#resMeta").textContent = `topic: ${poll.topic} • id: ${poll.id} • total votes: ${poll.totalVotes || 0}`;
  $("#resTitle").textContent = poll.title;

  const total = poll.options.reduce((s,o)=>s+o.votes,0) || 0;
  const bars = $("#resBars");
  bars.innerHTML = "";

  poll.options
    .slice()
    .sort((a,b)=>b.votes-a.votes)
    .forEach(o=>{
      const pct = total ? Math.round((o.votes/total)*100) : 0;

      const div = document.createElement("div");
      div.className = "bar";
      div.innerHTML = `
        <div class="barTop">
          <div class="label">${escapeHtml(o.text)}</div>
          <div class="num">${o.votes} • ${pct}%</div>
        </div>
        <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      `;
      bars.appendChild(div);
    });

  $("#btnBackToPoll").onclick = () => location.hash = `#poll=${poll.id}`;
  $("#btnBackHome2").onclick = () => location.hash = "#home";
}

// ABOUT
function renderAbout() {
  show("viewAbout");
  applyAuthUI();
}

// ===================== Nav wiring =====================
$("#navHome").onclick = () => location.hash = "#home";
$("#navCreate").onclick = () => location.hash = "#create";
$("#navOpen").onclick = () => location.hash = "#open";
$("#navAbout").onclick = () => location.hash = "#about";
$("#navAuth").onclick = () => {
  const u = currentUser();
  location.hash = u ? "#profile" : "#auth";
};
$("#navLogout").onclick = logout;

$("#btnSeedAgain").onclick = () => { seedMore(); renderHome(); };

// ===================== Route =====================
function route() {
  seedIfEmpty();
  applyAuthUI();

  const r = parseHash();
  if (r.view === "home") renderHome();
  else if (r.view === "create") initCreate();
  else if (r.view === "open") initOpen();
  else if (r.view === "about") renderAbout();
  else if (r.view === "auth") initAuth();
  else if (r.view === "profile") renderProfile();
  else if (r.view === "poll") renderPoll(r.id);
  else if (r.view === "results") renderResults(r.id);
}

window.addEventListener("hashchange", route);
route();