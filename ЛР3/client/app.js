const { createApp } = Vue;

createApp({
  data() {
    return {
      currentView: "home",
      currentPollId: null,
      currentResultsId: null,

      stats: {
        pollsCount: 0,
        votesCount: 0,
        usersCount: 0
      },

      polls: [],
      topics: [],
      selectedTopic: "Усі",

      currentUser: null,
      profile: null,

      activePoll: null,
      resultsPoll: null,
      pollHasVoted: false,
      selectedVoteOptions: [],

      openValue: "",

      authTab: "login",
      loginForm: {
        email: "",
        password: ""
      },
      registerForm: {
        name: "",
        email: "",
        password: "",
        dob: "",
        gender: "Чоловіча"
      },

      createForm: {
        topicSelect: "Інше",
        topicCustom: "",
        title: "",
        options: ["", "", ""],
        multi: false,
        anon: true
      },

      errors: {},
      banners: {}
    };
  },

  computed: {
    createTopics() {
      const base = [
        "Їжа",
        "Кіно/Серіали",
        "Музика",
        "Ігри",
        "Технології",
        "Навчання",
        "Подорожі",
        "Спорт",
        "Психологія",
        "Стиль життя",
        "Інше"
      ];

      const unique = new Set([...base, ...this.topics, "Інше"]);
      return Array.from(unique);
    },

    filteredPolls() {
      if (this.selectedTopic === "Усі") return this.polls;
      return this.polls.filter((poll) => poll.topic === this.selectedTopic);
    },

    completedPollIds() {
      const set = new Set();
      if (this.profile?.completedPolls?.length) {
        this.profile.completedPolls.forEach((item) => set.add(item.id));
      }
      return set;
    },

    shareLink() {
      if (!this.activePoll) return "—";
      return `${location.origin}/#poll=${this.activePoll.id}`;
    }
  },

  methods: {
    async api(url, options = {}) {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Помилка запиту.");
      }

      return data;
    },

    clearErrors() {
      this.errors = {};
    },

    clearBanners() {
      this.banners = {};
    },

    formatDate(value) {
      if (!value) return "—";
      return new Date(value).toLocaleDateString();
    },

    getPercent(votes, total) {
      if (!total) return 0;
      return Math.round((votes / total) * 100);
    },

    goTo(hash) {
      location.hash = hash;
    },

    parseHash() {
      const hash = (location.hash || "#home").replace("#", "");

      if (hash.startsWith("poll=")) {
        return { view: "poll", id: hash.split("poll=")[1] };
      }

      if (hash.startsWith("results=")) {
        return { view: "results", id: hash.split("results=")[1] };
      }

      if (hash === "create") return { view: "create" };
      if (hash === "open") return { view: "open" };
      if (hash === "auth") return { view: "auth" };
      if (hash === "profile") return { view: "profile" };
      if (hash === "about") return { view: "about" };

      return { view: "home" };
    },

    async handleRoute() {
      const route = this.parseHash();
      this.currentView = route.view;
      this.clearErrors();
      this.clearBanners();

      if (route.view === "home") {
        await this.loadHome();
      }

      if (route.view === "poll" && route.id) {
        await this.loadPoll(route.id);
      }

      if (route.view === "results" && route.id) {
        await this.loadResults(route.id);
      }

      if (route.view === "profile") {
        await this.loadProfile();
      }
    },

    async restoreCurrentUser() {
      const email = localStorage.getItem("currentUserEmail");
      if (!email) {
        this.currentUser = null;
        return;
      }

      try {
        const data = await this.api(`/api/users/${encodeURIComponent(email)}`);
        this.currentUser = data.user;
      } catch {
        localStorage.removeItem("currentUserEmail");
        this.currentUser = null;
      }
    },

    async loadHome() {
      const [statsData, topicsData, pollsData] = await Promise.all([
        this.api("/api/stats"),
        this.api("/api/topics"),
        this.api("/api/polls")
      ]);

      this.stats = statsData;
      this.topics = topicsData.topics || [];
      this.polls = pollsData.polls || [];

      if (this.currentUser) {
        try {
          const profileData = await this.api(`/api/profile/${encodeURIComponent(this.currentUser.email)}`);
          this.profile = profileData;
        } catch {
          this.profile = null;
        }
      }
    },

    async loadPoll(id) {
      try {
        const data = await this.api(`/api/polls/${encodeURIComponent(id)}`);
        this.activePoll = data.poll;
        this.selectedVoteOptions = [];
        this.pollHasVoted = false;

        if (this.currentUser) {
          const votedData = await this.api(
            `/api/polls/${encodeURIComponent(id)}/voted/${encodeURIComponent(this.currentUser.email)}`
          );
          this.pollHasVoted = votedData.voted;
        }
      } catch (error) {
        this.goTo("#home");
      }
    },

    async loadResults(id) {
      try {
        const data = await this.api(`/api/polls/${encodeURIComponent(id)}`);
        this.resultsPoll = data.poll;
      } catch {
        this.goTo("#home");
      }
    },

    async loadProfile() {
      if (!this.currentUser) {
        this.goTo("#auth");
        return;
      }

      try {
        const data = await this.api(`/api/profile/${encodeURIComponent(this.currentUser.email)}`);
        this.profile = data;
      } catch (error) {
        this.banners.login = error.message;
        this.goTo("#auth");
      }
    },

    addOptionRow() {
      if (this.createForm.options.length >= 10) {
        this.banners.create = "Максимум 10 варіантів.";
        return;
      }
      this.createForm.options.push("");
    },

    removeOptionRow(index) {
      this.createForm.options.splice(index, 1);
    },

    async submitCreateForm() {
      this.clearErrors();
      this.clearBanners();

      if (!this.currentUser) {
        this.banners.create = "Спочатку увійди в акаунт.";
        return;
      }

      const topic =
        this.createForm.topicSelect === "Інше"
          ? this.createForm.topicCustom.trim()
          : this.createForm.topicSelect.trim();

      const title = this.createForm.title.trim();
      const options = this.createForm.options.map((item) => item.trim()).filter(Boolean);

      if (!topic || topic.length < 2) {
        this.errors.createTopic = "Вкажи тему (мінімум 2 символи).";
      }

      if (!title || title.length < 5) {
        this.errors.createTitle = "Питання має бути мінімум 5 символів.";
      }

      if (options.length < 2) {
        this.errors.createOptions = "Потрібно мінімум 2 варіанти.";
      } else {
        const normalized = options.map((item) => item.toLowerCase());
        const unique = new Set(normalized);
        if (unique.size !== normalized.length) {
          this.errors.createOptions = "Варіанти повинні бути унікальні.";
        }
      }

      if (this.errors.createTopic || this.errors.createTitle || this.errors.createOptions) {
        return;
      }

      try {
        const data = await this.api("/api/polls", {
          method: "POST",
          body: JSON.stringify({
            title,
            topic,
            options,
            multi: this.createForm.multi,
            anon: this.createForm.anon,
            authorEmail: this.currentUser.email
          })
        });

        this.banners.create = `✅ Створено! ID: ${data.poll.id}. Відкриваю...`;

        this.createForm = {
          topicSelect: "Інше",
          topicCustom: "",
          title: "",
          options: ["", "", ""],
          multi: false,
          anon: true
        };

        await this.loadHome();

        setTimeout(() => {
          this.goTo(`#poll=${data.poll.id}`);
        }, 350);
      } catch (error) {
        this.banners.create = `❌ ${error.message}`;
      }
    },

    async openPollByInput() {
      this.clearErrors();

      const value = this.openValue.trim();
      if (!value) {
        this.errors.open = "Введи ID або посилання.";
        return;
      }

      const match = value.match(/poll=([a-z0-9]+)/i);
      const id = match?.[1] || value.replace(/[^a-z0-9]/gi, "");

      if (!id) {
        this.errors.open = "Не можу знайти ID в цьому рядку.";
        return;
      }

      try {
        await this.api(`/api/polls/${encodeURIComponent(id)}`);
        this.goTo(`#poll=${id}`);
      } catch {
        this.errors.open = "Опитування з таким ID не знайдено.";
      }
    },

    toggleVoteOption(optionId, multi) {
      if (multi) {
        if (this.selectedVoteOptions.includes(optionId)) {
          this.selectedVoteOptions = this.selectedVoteOptions.filter((id) => id !== optionId);
        } else {
          this.selectedVoteOptions.push(optionId);
        }
      } else {
        this.selectedVoteOptions = [optionId];
      }
    },

    async submitVote() {
      this.clearBanners();

      if (!this.currentUser) {
        this.banners.vote = "❌ Потрібен вхід.";
        return;
      }

      if (!this.activePoll) return;

      try {
        await this.api(`/api/polls/${encodeURIComponent(this.activePoll.id)}/vote`, {
          method: "POST",
          body: JSON.stringify({
            userEmail: this.currentUser.email,
            selections: this.selectedVoteOptions
          })
        });

        this.banners.vote = "✅ Голос зараховано.";

        if (this.profile) {
          await this.loadProfile();
        }

        setTimeout(() => {
          this.goTo(`#results=${this.activePoll.id}`);
        }, 300);
      } catch (error) {
        this.banners.vote = `❌ ${error.message}`;
      }
    },

    async deletePoll() {
      if (!this.activePoll) return;

      const confirmed = confirm("Видалити це опитування?");
      if (!confirmed) return;

      try {
        await this.api(`/api/polls/${encodeURIComponent(this.activePoll.id)}`, {
          method: "DELETE"
        });

        await this.loadHome();
        this.goTo("#home");
      } catch (error) {
        this.banners.vote = `❌ ${error.message}`;
      }
    },

    async copyLink() {
      if (!this.activePoll) return;

      try {
        await navigator.clipboard.writeText(this.shareLink);
        this.banners.vote = "🔗 Посилання скопійовано.";
      } catch {
        this.banners.vote = "❌ Не вдалося скопіювати посилання.";
      }
    },

    async registerUser() {
      this.clearErrors();
      this.clearBanners();

      const name = this.registerForm.name.trim();
      const email = this.registerForm.email.trim().toLowerCase();
      const password = this.registerForm.password;
      const dob = this.registerForm.dob;
      const gender = this.registerForm.gender;

      if (!name || name.length < 2) {
        this.errors.regName = "Ім’я мінімум 2 символи.";
      }

      if (!email) {
        this.errors.regEmail = "Введи email.";
      }

      if (!password || password.length < 4) {
        this.errors.regPassword = "Пароль мінімум 4 символи.";
      }

      if (this.errors.regName || this.errors.regEmail || this.errors.regPassword) {
        return;
      }

      try {
        const data = await this.api("/api/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, dob, gender })
        });

        localStorage.setItem("currentUserEmail", data.user.email);
        this.currentUser = data.user;
        this.banners.register = "✅ Акаунт створено! Вхід виконано.";

        await this.loadProfile();

        setTimeout(() => {
          this.goTo("#profile");
        }, 300);
      } catch (error) {
        this.banners.register = `❌ ${error.message}`;
      }
    },

    async loginUser() {
      this.clearErrors();
      this.clearBanners();

      const email = this.loginForm.email.trim().toLowerCase();
      const password = this.loginForm.password;

      if (!email) {
        this.errors.loginEmail = "Введи email.";
      }

      if (!password) {
        this.errors.loginPassword = "Введи пароль.";
      }

      if (this.errors.loginEmail || this.errors.loginPassword) {
        return;
      }

      try {
        const data = await this.api("/api/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        localStorage.setItem("currentUserEmail", data.user.email);
        this.currentUser = data.user;
        this.banners.login = "✅ Успішний вхід!";

        await this.loadProfile();

        setTimeout(() => {
          this.goTo("#profile");
        }, 300);
      } catch (error) {
        this.banners.login = `❌ ${error.message}`;
      }
    },

    logoutUser() {
      localStorage.removeItem("currentUserEmail");
      this.currentUser = null;
      this.profile = null;
      this.goTo("#home");
    },

    async resetMyStats() {
      if (!this.currentUser) return;

      const confirmed = confirm("Скинути твою статистику (пройдені опитування)?");
      if (!confirmed) return;

      try {
        await this.api(`/api/profile/${encodeURIComponent(this.currentUser.email)}/reset`, {
          method: "POST"
        });

        await this.loadProfile();
        await this.loadHome();
      } catch (error) {
        alert(error.message);
      }
    }
  },

  async mounted() {
    await this.restoreCurrentUser();
    window.addEventListener("hashchange", this.handleRoute);
    await this.handleRoute();
  }
}).mount("#app");