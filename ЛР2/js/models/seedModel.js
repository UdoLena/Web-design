// js/models/seedModel.js

import { dbLoad } from "./db.js";
import { createPoll } from "./pollModel.js";

export function seedIfEmpty() {
  const db = dbLoad();

  if (db.polls.length) {
    return;
  }

  const demoPolls = [
    { topic: "Їжа", title: "Який сніданок топ?", multi: false, opts: ["Вівсянка", "Яєчня", "Сендвіч", "Йогурт"] },
    { topic: "Їжа", title: "Піцца: найкраща начинка?", multi: true, opts: ["Пепероні", "Гриби", "4 сири", "Ананас", "Овочі"] },
    { topic: "Кіно/Серіали", title: "Що більше любиш?", multi: false, opts: ["Серіали", "Фільми", "Аніме", "Документалки"] },
    { topic: "Музика", title: "Який жанр частіше слухаєш?", multi: true, opts: ["Pop", "Rap/Hip-Hop", "Rock", "EDM", "Lo-fi", "K-pop"] },
    { topic: "Ігри", title: "Платформа для ігор?", multi: true, opts: ["PC", "PlayStation", "Xbox", "Mobile", "Nintendo"] },
    { topic: "Технології", title: "Який браузер твій основний?", multi: false, opts: ["Chrome", "Edge", "Firefox", "Safari", "Opera"] }
  ];

  demoPolls.forEach((poll) => {
    createPoll({
      title: poll.title,
      topic: poll.topic,
      multi: poll.multi,
      anon: true,
      options: poll.opts
    });
  });
}

export function seedMore() {
  const extraPolls = [
    { topic: "Технології", title: "Яка ОС основна?", multi: false, opts: ["Windows", "macOS", "Linux", "Інше"] },
    { topic: "Ігри", title: "Який жанр ігор топ?", multi: true, opts: ["RPG", "Shooter", "Strategy", "Indie", "Sports", "Survival"] },
    { topic: "Їжа", title: "Що вибереш на вечерю?", multi: false, opts: ["Паста", "Суші", "Бургер", "Салат"] },
    { topic: "Навчання", title: "Що складніше?", multi: false, opts: ["Математика", "Програмування", "Англійська", "Все норм"] }
  ];

  extraPolls.forEach((poll) => {
    createPoll({
      title: poll.title,
      topic: poll.topic,
      multi: poll.multi,
      anon: true,
      options: poll.opts
    });
  });
}