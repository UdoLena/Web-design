// js/models/pollModel.js

import { dbLoad, dbSave, uid, nowISO, clip } from "./db.js";
import { getCurrentUser } from "./authModel.js";

export function getAllPolls() {
  const db = dbLoad();
  return db.polls;
}

export function getPollById(id) {
  const db = dbLoad();
  return db.polls.find((poll) => poll.id === id) ?? null;
}

export function createPoll({ title, options, multi, anon, topic }) {
  const db = dbLoad();

  const normalizedTitle = clip(title, 120);
  const normalizedTopic = clip(topic, 40) || "Інше";
  const normalizedOptions = (options || [])
    .map((option) => clip(option, 60))
    .filter(Boolean);

  if (normalizedTopic.length < 2) {
    throw new Error("Тема має містити мінімум 2 символи.");
  }

  if (normalizedTitle.length < 5) {
    throw new Error("Питання має бути мінімум 5 символів.");
  }

  if (normalizedOptions.length < 2) {
    throw new Error("Потрібно мінімум 2 варіанти.");
  }

  const uniqueOptions = new Set(
    normalizedOptions.map((option) => option.toLowerCase())
  );

  if (uniqueOptions.size !== normalizedOptions.length) {
    throw new Error("Варіанти повинні бути унікальні.");
  }

  const poll = {
    id: uid(),
    createdAt: nowISO(),
    title: normalizedTitle,
    topic: normalizedTopic,
    multi: Boolean(multi),
    anon: Boolean(anon),
    options: normalizedOptions.map((text) => ({
      id: uid(),
      text,
      votes: 0
    })),
    totalVotes: 0
  };

  db.polls.unshift(poll);
  dbSave(db);

  return poll;
}

export function deletePoll(pollId) {
  const db = dbLoad();

  db.polls = db.polls.filter((poll) => poll.id !== pollId);

  db.users.forEach((user) => {
    user.stats.completed = (user.stats.completed || []).filter(
      (item) => item.pollId !== pollId
    );
  });

  dbSave(db);
}

export function hasUserVoted(user, pollId) {
  if (!user) {
    return false;
  }

  const completed = user.stats?.completed ?? [];
  return completed.some((item) => item.pollId === pollId);
}

export function recordVote(pollId, selections) {
  const db = dbLoad();
  const poll = db.polls.find((item) => item.id === pollId);

  if (!poll) {
    throw new Error("Опитування не знайдено.");
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    throw new Error("Потрібен вхід.");
  }

  const userInDb = db.users.find((user) => user.email === currentUser.email);

  if (!userInDb) {
    throw new Error("Користувач не знайдений.");
  }

  if (hasUserVoted(userInDb, pollId)) {
    throw new Error("Ти вже проходив це опитування.");
  }

  const validOptionIds = new Set(poll.options.map((option) => option.id));
  const chosen = (selections || []).filter((id) => validOptionIds.has(id));

  if (!chosen.length) {
    throw new Error("Обери хоча б один варіант.");
  }

  if (!poll.multi && chosen.length > 1) {
    throw new Error("Для цього опитування можна обрати лише один варіант.");
  }

  chosen.forEach((optionId) => {
    const option = poll.options.find((item) => item.id === optionId);
    if (option) {
      option.votes += 1;
    }
  });

  poll.totalVotes += 1;

  userInDb.stats.votesCast = (userInDb.stats.votesCast || 0) + 1;
  userInDb.stats.completed = userInDb.stats.completed || [];
  userInDb.stats.completed.unshift({
    pollId,
    at: nowISO(),
    selections: chosen
  });

  dbSave(db);
}

export function getPollStats() {
  const db = dbLoad();

  return {
    pollsCount: db.polls.length,
    votesCount: db.polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0),
    usersCount: db.users.length
  };
}

export function getTopicsFromPolls() {
  const db = dbLoad();

  return Array.from(new Set(db.polls.map((poll) => poll.topic))).sort((a, b) =>
    a.localeCompare(b)
  );
}