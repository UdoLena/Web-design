const path = require("path");
const express = require("express");
const { run, get, all, initDb } = require("./db");

const app = express();
const PORT = 3000;

const TOPICS = [
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

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));

function uid() {
  return (
    Math.random().toString(16).slice(2, 8) +
    Math.random().toString(16).slice(2, 6)
  );
}

function nowISO() {
  return new Date().toISOString();
}

function clip(text, max) {
  return String(text ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

async function getPollTotalVotes(pollId) {
  const row = await get(
    `
      SELECT COUNT(DISTINCT user_email) AS totalVotes
      FROM votes
      WHERE poll_id = ?
    `,
    [pollId]
  );
  return row?.totalVotes || 0;
}

async function getPollWithOptions(pollId) {
  const poll = await get(
    `
      SELECT id, title, topic, multi, anon, author_email, created_at
      FROM polls
      WHERE id = ?
    `,
    [pollId]
  );

  if (!poll) return null;

  const options = await all(
    `
      SELECT id, text, votes
      FROM options
      WHERE poll_id = ?
      ORDER BY rowid ASC
    `,
    [pollId]
  );

  const totalVotes = await getPollTotalVotes(pollId);

  return {
    id: poll.id,
    title: poll.title,
    topic: poll.topic,
    multi: Boolean(poll.multi),
    anon: Boolean(poll.anon),
    authorEmail: poll.author_email,
    createdAt: poll.created_at,
    options,
    totalVotes
  };
}

async function seedIfEmpty() {
  const row = await get(`SELECT COUNT(*) AS count FROM polls`);
  if (row?.count > 0) return;

  const demoPolls = [
    {
      topic: "Їжа",
      title: "Який сніданок топ?",
      multi: false,
      anon: true,
      options: ["Вівсянка", "Яєчня", "Сендвіч", "Йогурт"]
    },
    {
      topic: "Їжа",
      title: "Піцца: найкраща начинка?",
      multi: true,
      anon: true,
      options: ["Пепероні", "Гриби", "4 сири", "Ананас", "Овочі"]
    },
    {
      topic: "Кіно/Серіали",
      title: "Що більше любиш?",
      multi: false,
      anon: true,
      options: ["Серіали", "Фільми", "Аніме", "Документалки"]
    },
    {
      topic: "Музика",
      title: "Який жанр частіше слухаєш?",
      multi: true,
      anon: true,
      options: ["Pop", "Rap/Hip-Hop", "Rock", "EDM", "Lo-fi", "K-pop"]
    },
    {
      topic: "Ігри",
      title: "Платформа для ігор?",
      multi: true,
      anon: true,
      options: ["PC", "PlayStation", "Xbox", "Mobile", "Nintendo"]
    },
    {
      topic: "Технології",
      title: "Який браузер твій основний?",
      multi: false,
      anon: true,
      options: ["Chrome", "Edge", "Firefox", "Safari", "Opera"]
    }
  ];

  for (const item of demoPolls) {
    const pollId = uid();
    await run(
      `
        INSERT INTO polls (id, title, topic, multi, anon, author_email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        pollId,
        clip(item.title, 120),
        clip(item.topic, 40),
        item.multi ? 1 : 0,
        item.anon ? 1 : 0,
        null,
        nowISO()
      ]
    );

    for (const text of item.options) {
      await run(
        `
          INSERT INTO options (id, poll_id, text, votes)
          VALUES (?, ?, ?, 0)
        `,
        [uid(), pollId, clip(text, 60)]
      );
    }
  }
}

/* ---------- AUTH ---------- */

app.post("/api/register", async (req, res) => {
  try {
    const name = clip(req.body.name, 40);
    const email = clip(req.body.email, 100).toLowerCase();
    const password = String(req.body.password || "");
    const dob = clip(req.body.dob, 30);
    const gender = clip(req.body.gender, 20) || "Інше";

    if (name.length < 2) {
      return res.status(400).json({ message: "Ім’я мінімум 2 символи." });
    }

    if (!email) {
      return res.status(400).json({ message: "Введи email." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Невірний формат email." });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: "Пароль мінімум 4 символи." });
    }

    const existing = await get(`SELECT email FROM users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(400).json({ message: "Користувач з таким email вже існує." });
    }

    await run(
      `
        INSERT INTO users (name, email, password, gender, dob, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [name, email, password, gender, dob, nowISO()]
    );

    const user = await get(
      `
        SELECT id, name, email, gender, dob, created_at
        FROM users
        WHERE email = ?
      `,
      [email]
    );

    res.json({
      message: "Акаунт створено.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = clip(req.body.email, 100).toLowerCase();
    const password = String(req.body.password || "");

    const user = await get(
      `
        SELECT id, name, email, gender, dob, created_at
        FROM users
        WHERE email = ? AND password = ?
      `,
      [email, password]
    );

    if (!user) {
      return res.status(400).json({ message: "Невірний email або пароль." });
    }

    res.json({
      message: "Успішний вхід.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        createdAt: user.created_at
      }
    });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.get("/api/users/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase();

    const user = await get(
      `
        SELECT id, name, email, gender, dob, created_at
        FROM users
        WHERE email = ?
      `,
      [email]
    );

    if (!user) {
      return res.status(404).json({ message: "Користувач не знайдений." });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        createdAt: user.created_at
      }
    });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

/* ---------- STATS / TOPICS ---------- */

app.get("/api/stats", async (_req, res) => {
  try {
    const pollsRow = await get(`SELECT COUNT(*) AS count FROM polls`);
    const usersRow = await get(`SELECT COUNT(*) AS count FROM users`);
    const votesRow = await get(
      `SELECT COUNT(*) AS count FROM (SELECT DISTINCT poll_id, user_email FROM votes)`
    );

    res.json({
      pollsCount: pollsRow?.count || 0,
      votesCount: votesRow?.count || 0,
      usersCount: usersRow?.count || 0
    });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.get("/api/topics", async (_req, res) => {
  try {
    const rows = await all(
      `
        SELECT DISTINCT topic
        FROM polls
        ORDER BY topic COLLATE NOCASE ASC
      `
    );

    const topics = rows.map((row) => row.topic);
    res.json({ topics });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

/* ---------- POLLS ---------- */

app.get("/api/polls", async (_req, res) => {
  try {
    const rows = await all(
      `
        SELECT
          p.id,
          p.title,
          p.topic,
          p.multi,
          p.anon,
          p.author_email,
          p.created_at,
          COUNT(DISTINCT v.user_email) AS totalVotes
        FROM polls p
        LEFT JOIN votes v ON v.poll_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `
    );

    const polls = rows.map((row) => ({
      id: row.id,
      title: row.title,
      topic: row.topic,
      multi: Boolean(row.multi),
      anon: Boolean(row.anon),
      authorEmail: row.author_email,
      createdAt: row.created_at,
      totalVotes: row.totalVotes || 0
    }));

    res.json({ polls });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.get("/api/polls/:id", async (req, res) => {
  try {
    const poll = await getPollWithOptions(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: "Опитування не знайдено." });
    }

    res.json({ poll });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.post("/api/polls", async (req, res) => {
  try {
    const title = clip(req.body.title, 120);
    const topic = clip(req.body.topic, 40) || "Інше";
    const multi = !!req.body.multi;
    const anon = !!req.body.anon;
    const authorEmail = clip(req.body.authorEmail, 100).toLowerCase() || null;
    const rawOptions = Array.isArray(req.body.options) ? req.body.options : [];

    const options = rawOptions
      .map((item) => clip(item, 60))
      .filter(Boolean);

    if (topic.length < 2) {
      return res.status(400).json({ message: "Тема має містити мінімум 2 символи." });
    }

    if (title.length < 5) {
      return res.status(400).json({ message: "Питання має бути мінімум 5 символів." });
    }

    if (options.length < 2) {
      return res.status(400).json({ message: "Потрібно мінімум 2 варіанти." });
    }

    const unique = new Set(options.map((item) => item.toLowerCase()));
    if (unique.size !== options.length) {
      return res.status(400).json({ message: "Варіанти повинні бути унікальні." });
    }

    const pollId = uid();

    await run(
      `
        INSERT INTO polls (id, title, topic, multi, anon, author_email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [pollId, title, topic, multi ? 1 : 0, anon ? 1 : 0, authorEmail, nowISO()]
    );

    for (const text of options) {
      await run(
        `
          INSERT INTO options (id, poll_id, text, votes)
          VALUES (?, ?, ?, 0)
        `,
        [uid(), pollId, text]
      );
    }

    const poll = await getPollWithOptions(pollId);
    res.json({ message: "Опитування створено.", poll });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.get("/api/polls/:id/voted/:email", async (req, res) => {
  try {
    const pollId = req.params.id;
    const email = String(req.params.email || "").toLowerCase();

    const row = await get(
      `
        SELECT id
        FROM votes
        WHERE poll_id = ? AND user_email = ?
        LIMIT 1
      `,
      [pollId, email]
    );

    res.json({ voted: !!row });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.post("/api/polls/:id/vote", async (req, res) => {
  try {
    const pollId = req.params.id;
    const userEmail = clip(req.body.userEmail, 100).toLowerCase();
    const selections = Array.isArray(req.body.selections) ? req.body.selections : [];

    if (!userEmail) {
      return res.status(400).json({ message: "Потрібен вхід." });
    }

    const user = await get(`SELECT email FROM users WHERE email = ?`, [userEmail]);
    if (!user) {
      return res.status(400).json({ message: "Користувач не знайдений." });
    }

    const poll = await getPollWithOptions(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Опитування не знайдено." });
    }

    const already = await get(
      `
        SELECT id
        FROM votes
        WHERE poll_id = ? AND user_email = ?
        LIMIT 1
      `,
      [pollId, userEmail]
    );

    if (already) {
      return res.status(400).json({ message: "Ти вже проходив це опитування." });
    }

    const validIds = new Set(poll.options.map((item) => item.id));
    const chosen = selections.filter((id) => validIds.has(id));

    if (!chosen.length) {
      return res.status(400).json({ message: "Обери хоча б один варіант." });
    }

    if (!poll.multi && chosen.length > 1) {
      return res.status(400).json({ message: "Для цього опитування можна обрати лише один варіант." });
    }

    for (const optionId of chosen) {
      await run(
        `
          UPDATE options
          SET votes = votes + 1
          WHERE id = ? AND poll_id = ?
        `,
        [optionId, pollId]
      );

      await run(
        `
          INSERT INTO votes (poll_id, user_email, option_id, voted_at)
          VALUES (?, ?, ?, ?)
        `,
        [pollId, userEmail, optionId, nowISO()]
      );
    }

    const updatedPoll = await getPollWithOptions(pollId);

    res.json({
      message: "Голос зараховано.",
      poll: updatedPoll
    });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.delete("/api/polls/:id", async (req, res) => {
  try {
    const pollId = req.params.id;

    await run(`DELETE FROM votes WHERE poll_id = ?`, [pollId]);
    await run(`DELETE FROM options WHERE poll_id = ?`, [pollId]);
    await run(`DELETE FROM polls WHERE id = ?`, [pollId]);

    res.json({ message: "Опитування видалено." });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

/* ---------- PROFILE ---------- */

app.get("/api/profile/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase();

    const user = await get(
      `
        SELECT id, name, email, gender, dob, created_at
        FROM users
        WHERE email = ?
      `,
      [email]
    );

    if (!user) {
      return res.status(404).json({ message: "Користувач не знайдений." });
    }

    const completedPollsRaw = await all(
      `
        SELECT
          p.id,
          p.title,
          p.topic,
          MAX(v.voted_at) AS completedAt
        FROM votes v
        JOIN polls p ON p.id = v.poll_id
        WHERE v.user_email = ?
        GROUP BY p.id
        ORDER BY completedAt DESC
        LIMIT 30
      `,
      [email]
    );

    const votesCastRow = await get(
      `
        SELECT COUNT(DISTINCT poll_id) AS count
        FROM votes
        WHERE user_email = ?
      `,
      [email]
    );

    const topicRows = await all(
      `
        SELECT
          p.topic AS topic,
          COUNT(DISTINCT v.poll_id) AS cnt
        FROM votes v
        JOIN polls p ON p.id = v.poll_id
        WHERE v.user_email = ?
        GROUP BY p.topic
        ORDER BY cnt DESC, p.topic ASC
      `,
      [email]
    );

    const pollsCountRow = await get(`SELECT COUNT(*) AS count FROM polls`);

    const completedCount = votesCastRow?.count || 0;
    const completionPct = pollsCountRow?.count
      ? Math.round((completedCount / pollsCountRow.count) * 100)
      : 0;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        createdAt: user.created_at
      },
      profileStats: {
        completedCount,
        votesCast: completedCount,
        topTopic: topicRows[0]?.topic || "—",
        completionPct
      },
      completedPolls: completedPollsRaw.map((item) => ({
        id: item.id,
        title: item.title,
        topic: item.topic,
        completedAt: new Date(item.completedAt).toLocaleString()
      }))
    });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.post("/api/profile/:email/reset", async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase();

    const user = await get(`SELECT email FROM users WHERE email = ?`, [email]);
    if (!user) {
      return res.status(404).json({ message: "Користувач не знайдений." });
    }

    const votes = await all(
      `
        SELECT option_id
        FROM votes
        WHERE user_email = ?
      `,
      [email]
    );

    for (const vote of votes) {
      await run(
        `
          UPDATE options
          SET votes = CASE WHEN votes > 0 THEN votes - 1 ELSE 0 END
          WHERE id = ?
        `,
        [vote.option_id]
      );
    }

    await run(`DELETE FROM votes WHERE user_email = ?`, [email]);

    res.json({ message: "Статистику скинуто." });
  } catch {
    res.status(500).json({ message: "Помилка сервера." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

(async () => {
  try {
    await initDb();
    await seedIfEmpty();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("DB init error:", error);
  }
})();