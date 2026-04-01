// js/models/authModel.js

import { dbLoad, dbSave, uid, nowISO, isValidEmail } from "./db.js";

export function getCurrentUser() {
  const db = dbLoad();
  const email = db.sessions?.current?.email ?? null;

  if (!email) {
    return null;
  }

  return db.users.find((user) => user.email === email) ?? null;
}

export function login(email, password) {
  const db = dbLoad();

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find(
    (item) => item.email === normalizedEmail && item.password === password
  );

  if (!user) {
    throw new Error("Невірний email або пароль.");
  }

  db.sessions.current = {
    email: user.email,
    at: nowISO()
  };

  dbSave(db);
  return user;
}

export function registerUser({ name, email, password, gender, dob }) {
  const db = dbLoad();

  const normalizedName = String(name ?? "").trim();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  if (normalizedName.length < 2) {
    throw new Error("Ім’я мінімум 2 символи.");
  }

  if (!normalizedEmail) {
    throw new Error("Введи email.");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Невірний формат email.");
  }

  if (normalizedPassword.length < 4) {
    throw new Error("Пароль мінімум 4 символи.");
  }

  if (db.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Користувач з таким email вже існує.");
  }

  const newUser = {
    id: uid(),
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
    gender: gender || "Інше",
    dob: dob || "",
    createdAt: nowISO(),
    stats: {
      votesCast: 0,
      completed: []
    }
  };

  db.users.push(newUser);
  dbSave(db);

  return newUser;
}

export function logout() {
  const db = dbLoad();
  db.sessions.current = null;
  dbSave(db);
}

export function getUserByEmail(email) {
  const db = dbLoad();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  return db.users.find((user) => user.email === normalizedEmail) ?? null;
}

export function resetCurrentUserStats() {
  const db = dbLoad();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    throw new Error("Користувач не увійшов у систему.");
  }

  const userInDb = db.users.find((user) => user.email === currentUser.email);

  if (!userInDb) {
    throw new Error("Користувач не знайдений.");
  }

  userInDb.stats = {
    votesCast: 0,
    completed: []
  };

  dbSave(db);
  return userInDb;
}