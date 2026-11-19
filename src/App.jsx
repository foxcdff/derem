import { useMemo, useState } from "react";
import data from "./data.json";

const levels = [
  { name: "Beginner", min: 0, max: 4, description: "Начальный уровень. Начнём с базовой грамматики, слов и простых диалогов." },
  { name: "Elementary", min: 5, max: 8, description: "Базовый уровень. Ты уже можешь общаться на знакомые темы и готов расширять знания." },
  { name: "Intermediate", min: 9, max: 12, description: "Средний уровень. Можно развивать беглость речи, словарный запас и сложную грамматику." },
  { name: "Upper-Intermediate", min: 13, max: 15, description: "Выше среднего. Подойдёт углублённая практика и работа над свободным общением." }
];

const money = (value) => new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₸";

export default function App() {
  const [page, setPage] = useState("test");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [level, setLevel] = useState(null);
  const [format, setFormat] = useState("group");
  const [lessons, setLessons] = useState(3);
  const [duration, setDuration] = useState(3);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saved, setSaved] = useState(false);

  const currentQuestion = data.questions[questionIndex];
  const score = data.questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
  const selectedFormat = data.pricing.formats.find((item) => item.id === format);
  const selectedDuration = data.pricing.durations.find((item) => item.months === duration);
  const basePrice = selectedFormat.price * lessons * 4 * duration;
  const durationDiscount = basePrice * selectedDuration.discount / 100;
  const afterDuration = basePrice - durationDiscount;
  const promoDiscount = promo ? afterDuration * promo.discount / 100 : 0;
  const total = Math.max(0, Math.round(afterDuration - promoDiscount));
  const recommendedGroup = level ? data.groups.find((group) => group.level === level.name && group.places > 0) : null;

  function finishTest() {
    const result = levels.find((item) => score >= item.min && score <= item.max);
    setLevel(result);
    setPage("result");
  }

  function applyPromo() {
    const found = data.promocodes.find((item) => item.code === promoInput.trim().toUpperCase() && item.active);
    if (!found) {
      setPromo(null);
      setPromoMessage("Промокод не найден или больше не действует.");
      return;
    }
    setPromo(found);
    setPromoInput(found.code);
    setPromoMessage(`Промокод применён: скидка ${found.discount}%.`);
  }

  function submitApplication(event) {
    event.preventDefault();
    const application = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...form,
      level: level.name,
      format,
      lessonsPerWeek: lessons,
      duration,
      promocode: promo?.code || null,
      totalPrice: total,
      createdAt: new Date().toISOString()
    };
    const applications = JSON.parse(localStorage.getItem("englishSchoolApplications") || "[]");
    applications.push(application);
    localStorage.setItem("englishSchoolApplications", JSON.stringify(applications));
    setSaved(true);
    setPage("success");
  }

  function restart() {
    setPage("test");
    setQuestionIndex(0);
    setAnswers({});
    setLevel(null);
    setPromo(null);
    setPromoInput("");
    setPromoMessage("");
    setSaved(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={restart} aria-label="На главную">
          <span className="brand-mark">E</span>
          <span>english<span className="brand-light">school</span></span>
        </button>
        <span className="top-note">Подберём курс под твой уровень</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-dot" /> ПЕРСОНАЛЬНЫЙ ПОДБОР ОБУЧЕНИЯ</div>
        <h1>{page === "success" ? "Заявка готова!" : "Твой английский.\nТвой темп."}</h1>
        <p>Пройди короткий тест, выбери удобный формат и узнай стоимость обучения.</p>
      </section>

      <nav className="steps" aria-label="Этапы">
        {["Тест", "Уровень", "Курс", "Заявка"].map((label, index) => {
          const activeIndex = page === "test" ? 0 : page === "result" ? 1 : page === "course" || page === "calculator" ? 2 : 3;
          return <div className={`step ${index <= activeIndex ? "step-active" : ""}`} key={label}>
            <span>{index + 1}</span>{label}
          </div>;
        })}
      </nav>

      <section className="panel">
        {page === "test" && (
          <>
            <div className="panel-heading">
              <div><div className="kicker">ШАГ 01 / ТЕСТИРОВАНИЕ</div><h2>Определи свой уровень</h2></div>
              <span className="counter">{questionIndex + 1} / {data.questions.length}</span>
            </div>
            <div className="progress"><span style={{ width: `${((questionIndex + 1) / data.questions.length) * 100}%` }} /></div>
            <h3 className="question">{currentQuestion.question}</h3>
            <div className="answers">
              {currentQuestion.options.map((option, index) => (
                <button key={option} className={`answer ${answers[questionIndex] === index ? "answer-selected" : ""}`}
                  onClick={() => setAnswers({ ...answers, [questionIndex]: index })}>
                  <span className="answer-letter">{String.fromCharCode(65 + index)}</span>{option}
                </button>
              ))}
            </div>
            <div className="panel-actions">
              <button className="button button-ghost" disabled={questionIndex === 0} onClick={() => setQuestionIndex(questionIndex - 1)}>Назад</button>
              {questionIndex < data.questions.length - 1
                ? <button className="button button-primary" disabled={answers[questionIndex] === undefined} onClick={() => setQuestionIndex(questionIndex + 1)}>Следующий вопрос <span>→</span></button>
                : <button className="button button-primary" disabled={Object.keys(answers).length !== data.questions.length} onClick={finishTest}>Узнать результат <span>→</span></button>}
            </div>
            <p className="helper">Выбери один вариант ответа. Результат появится после всех 15 вопросов.</p>
          </>
        )}

        {page === "result" && level && (
          <>
            <div className="kicker">ШАГ 02 / РЕЗУЛЬТАТ</div>
            <div className="result-score">{score}<span> / 15 баллов</span></div>
            <div className="level-pill">ТВОЙ УРОВЕНЬ</div>
            <h2 className="result-level">{level.name}</h2>
            <p className="result-description">{level.description}</p>
            <div className="recommendation">
              <div className="recommend-icon">✦</div>
              <div><strong>Рекомендация школы</strong>
                {recommendedGroup
                  ? <p>Подойдёт группа <b>{recommendedGroup.id}</b> · {recommendedGroup.teacher} · {recommendedGroup.days}, {recommendedGroup.time}. Свободно мест: {recommendedGroup.places}.</p>
                  : <p>Сейчас нет свободной группы этого уровня. Можно оставить заявку на индивидуальное обучение.</p>}
              </div>
            </div>
            <div className="panel-actions">
              <button className="button button-ghost" onClick={restart}>Пройти заново</button>
              <button className="button button-primary" onClick={() => setPage("course")}>Подобрать курс <span>→</span></button>
            </div>
          </>
        )}

        {page === "course" && (
          <>
            <div className="kicker">ШАГ 03 / ПАРАМЕТРЫ КУРСА</div>
            <h2>Как тебе удобнее учиться?</h2>
            <p className="section-subtitle">Выбери формат занятий, нагрузку и продолжительность курса.</p>
            <h3 className="field-title">Формат обучения</h3>
            <div className="choice-grid">
              {data.pricing.formats.map((item) => <button key={item.id} className={`choice ${format === item.id ? "choice-active" : ""}`} onClick={() => setFormat(item.id)}>
                <span className="choice-check">{format === item.id ? "✓" : ""}</span><strong>{item.name}</strong><small>{item.description}</small><b>{money(item.price)} <small>/ занятие</small></b>
              </button>)}
            </div>
            <h3 className="field-title">Занятий в неделю</h3>
            <div className="segmented">
              {data.pricing.lessonsPerWeek.map((number) => <button key={number} className={lessons === number ? "segment-active" : ""} onClick={() => setLessons(number)}>{number}</button>)}
            </div>
            <h3 className="field-title">Срок обучения</h3>
            <div className="duration-grid">
              {data.pricing.durations.map((item) => <button key={item.months} className={`duration ${duration === item.months ? "duration-active" : ""}`} onClick={() => setDuration(item.months)}>
                <strong>{item.label}</strong><span>{item.discount ? `Скидка ${item.discount}%` : "Без скидки"}</span>
              </button>)}
            </div>
            <div className="panel-actions">
              <button className="button button-ghost" onClick={() => setPage("result")}>Назад</button>
              <button className="button button-primary" onClick={() => setPage("calculator")}>Рассчитать стоимость <span>→</span></button>
            </div>
          </>
        )}

        {page === "calculator" && (
          <>
            <div className="kicker">ШАГ 04 / РАСЧЁТ СТОИМОСТИ</div>
            <h2>Твой план обучения</h2>
            <p className="section-subtitle">Можно вернуться и изменить параметры курса в любой момент.</p>
            <div className="summary-list">
              <div><span>Уровень</span><strong>{level.name}</strong></div>
              <div><span>Формат</span><strong>{selectedFormat.name}</strong></div>
              <div><span>Занятий в неделю</span><strong>{lessons}</strong></div>
              <div><span>Продолжительность</span><strong>{duration} мес.</strong></div>
            </div>
            <div className="promo-box">
              <label htmlFor="promo">Промокод</label>
              <div className="promo-row"><input id="promo" value={promoInput} onChange={(e) => { setPromoInput(e.target.value); setPromo(null); setPromoMessage(""); }} placeholder="Например, WELCOME10" />
                <button className="button button-dark" onClick={applyPromo}>Применить</button></div>
              {promoMessage && <p className={`promo-message ${promo ? "success-text" : "error-text"}`}>{promoMessage}</p>}
              <small>Доступные примеры: WELCOME10, STUDENT5</small>
            </div>
            <div className="price-card">
              <div className="price-line"><span>Стоимость без скидок</span><strong>{money(basePrice)}</strong></div>
              <div className="price-line discount-line"><span>Скидка за срок ({selectedDuration.discount}%)</span><strong>− {money(durationDiscount)}</strong></div>
              {promo && <div className="price-line discount-line"><span>Промокод ({promo.discount}%)</span><strong>− {money(promoDiscount)}</strong></div>}
              <div className="price-total"><span>Итого за курс</span><strong>{money(total)}</strong></div>
              <small>Расчёт ориентировочный: 4 недели в месяце.</small>
            </div>
            <div className="panel-actions">
              <button className="button button-ghost" onClick={() => setPage("course")}>Изменить курс</button>
              <button className="button button-primary" onClick={() => setPage("application")}>Оставить заявку <span>→</span></button>
            </div>
          </>
        )}

        {page === "application" && (
          <>
            <div className="kicker">ПОСЛЕДНИЙ ШАГ / ЗАЯВКА</div>
            <h2>Оставь свои контакты</h2>
            <p className="section-subtitle">Школа сможет связаться с тобой по указанному номеру.</p>
            <form className="application-form" onSubmit={submitApplication}>
              <label>Твоё имя<input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Например, Алина" /></label>
              <label>Номер телефона<input required type="tel" pattern="[+0-9()\\-\\s]{7,20}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 777 123 45 67" /></label>
              <div className="application-total"><span>Стоимость выбранного курса</span><strong>{money(total)}</strong></div>
              <button className="button button-primary button-wide" type="submit">Отправить заявку <span>→</span></button>
            </form>
            <button className="back-link" onClick={() => setPage("calculator")}>← Вернуться к расчёту</button>
          </>
        )}

        {page === "success" && saved && (
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <div className="kicker">ЗАЯВКА СОХРАНЕНА</div>
            <h2>Спасибо, {form.name}!</h2>
            <p>Твоя заявка сохранена в этом браузере. Это демонстрационная версия без отправки данных на сервер.</p>
            <div className="success-details"><span>Уровень: <b>{level.name}</b></span><span>Формат: <b>{selectedFormat.name}</b></span><span>Стоимость: <b>{money(total)}</b></span></div>
            <button className="button button-primary button-wide" onClick={restart}>Вернуться на главную</button>
          </div>
        )}
      </section>
      <footer>© 2026 English School <span>Учись в своём темпе.</span></footer>
    </main>
  );
}