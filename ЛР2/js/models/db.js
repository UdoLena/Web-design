// js/models/db.js

export const DB_KEY = "pulse_survey_db_v2";

export const TOPICS = [
  "Їжа", "Кіно/Серіали", "Музика", "Ігри", "Технології", "Навчання",
  "Подорожі", "Спорт", "Психологія", "Стиль життя", "Інше"
];

export function dbLoad() {
  try {
    const value = JSON.parse(localStorage.getItem(DB_KEY));
    return value ?? getEmptyDb();
  } catch {
    return getEmptyDb();
  }
}

export function dbSave(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getEmptyDb() {
  return {
    polls: [],
    users: [],
    sessions: {
      current: null
    }
  };
}

export function uid() {
  return (
    Math.random().toString(16).slice(2, 8) +
    Math.random().toString(16).slice(2, 4)
  );
}

export function nowISO() {
  return new Date().toISOString();
}

export function clip(text, max = 120) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}