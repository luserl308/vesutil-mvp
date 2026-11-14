"use client";

import { useMemo, useState } from "react";

type Mode = "materials" | "services";
type Item = {
  id: number;
  title: string;
  category: string;
  place: string;
  price: string;
  unit: string;
  detail: string;
  mode: Mode;
  pickup: boolean;
  icon: string;
  keywords: string[];
};

const items: Item[] = [
  { id: 1, title: "Приём лома чёрных металлов", category: "Металлолом", place: "Москва, Южный округ", price: "от 18 000", unit: "₽ / тонна", detail: "Самовывоз от 1 тонны · Оплата на месте", mode: "materials", pickup: true, icon: "♻️", keywords: ["чёрный металл", "лом", "сталь", "железо"] },
  { id: 2, title: "Покупка картона и макулатуры", category: "Макулатура", place: "Химки, Московская область", price: "до 12 000", unit: "₽ / тонна", detail: "Принимаем прессованный картон и россыпью", mode: "materials", pickup: true, icon: "📦", keywords: ["бумага", "картон", "гофрокартон"] },
  { id: 3, title: "Приём ПЭТ-бутылки", category: "Пластик", place: "Люберцы, Московская область", price: "до 28", unit: "₽ / кг", detail: "Прозрачный сортированный ПЭТ", mode: "materials", pickup: false, icon: "🧴", keywords: ["пэт", "пластик", "бутылка"] },
  { id: 4, title: "Приём стеклобоя", category: "Стекло", place: "Подольск, Московская область", price: "По запросу", unit: "", detail: "Условия приёма зависят от цвета и степени сортировки", mode: "materials", pickup: false, icon: "🍾", keywords: ["стекло", "бой", "стеклобой"] },
  { id: 5, title: "Вывоз строительных отходов", category: "Вывоз и транспортировка", place: "Москва и область", price: "от 8 500", unit: "₽ / рейс", detail: "Контейнеры 8–27 м³ · Подача по заявке", mode: "services", pickup: true, icon: "🚛", keywords: ["контейнер", "строительный мусор", "вывоз отходов"] },
  { id: 6, title: "Демонтаж и разборка зданий", category: "Демонтаж", place: "Москва и Московская область", price: "По запросу", unit: "", detail: "Оценка объёма работ и выезд специалиста", mode: "services", pickup: false, icon: "🏗️", keywords: ["снос", "разборка", "здание"] },
  { id: 7, title: "Аренда экскаватора-погрузчика", category: "Аренда спецтехники", place: "Балашиха, Московская область", price: "от 2 500", unit: "₽ / час", detail: "Оператор включён · Минимум 4 часа", mode: "services", pickup: false, icon: "🚜", keywords: ["экскаватор", "погрузчик", "техника"] },
  { id: 8, title: "Погрузка и вывоз металлолома", category: "Погрузка и разгрузка", place: "Москва, Северный округ", price: "По запросу", unit: "", detail: "Погрузочная техника и транспорт по согласованию", mode: "services", pickup: true, icon: "🏭", keywords: ["металл", "погрузка", "лом"] },
];

const categories: Record<Mode, string[]> = {
  materials: ["Все материалы", "Металлолом", "Пластик", "Стекло", "Макулатура", "Электронные отходы", "Строительные отходы"],
  services: ["Все услуги", "Вывоз и транспортировка", "Демонтаж", "Аренда спецтехники", "Погрузка и разгрузка"],
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("materials");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все материалы");
  const [location, setLocation] = useState("");
  const [pickupOnly, setPickupOnly] = useState(false);
  const [sort, setSort] = useState("default");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    const normalizedLocation = location.trim().toLocaleLowerCase("ru");
    return items
      .filter((item) => item.mode === mode)
      .filter((item) => category === categories[mode][0] || item.category === category)
      .filter((item) => !normalizedQuery || [item.title, item.category, item.detail, ...item.keywords].join(" ").toLocaleLowerCase("ru").includes(normalizedQuery))
      .filter((item) => !normalizedLocation || item.place.toLocaleLowerCase("ru").includes(normalizedLocation))
      .filter((item) => !pickupOnly || item.pickup)
      .sort((a, b) => sort === "pickup" ? Number(b.pickup) - Number(a.pickup) : sort === "title" ? a.title.localeCompare(b.title, "ru") : a.id - b.id);
  }, [mode, query, category, location, pickupOnly, sort]);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setCategory(categories[nextMode][0]);
    setQuery("");
  }

  function resetFilters() {
    setQuery("");
    setCategory(categories[mode][0]);
    setLocation("");
    setPickupOnly(false);
    setSort("default");
  }

  return (
    <main>
      <header className="top">
        <a className="logo" href="#"><b>V</b> vesutil</a>
        <nav><a href="#how">Как это работает</a><a href="#catalog">Каталог</a><a href="#about">О платформе</a></nav>
        <a className="contact" href="mailto:hello@vesutil.ru">Связаться ↗</a>
      </header>

      <section className="hero">
        <div className="eyebrow">● ПЛАТФОРМА ДЛЯ ВТОРСЫРЬЯ И УСЛУГ</div>
        <h1>Найдите лучшее решение<br /><span>для вашего ресурса.</span></h1>
        <p>Сравнивайте предложения по цене, расстоянию и условиям.<br />Всё необходимое для обращения со вторсырьём — в одном месте.</p>

        <div className="search">
          <div className="tabs">
            <button className={mode === "materials" ? "selected" : ""} onClick={() => changeMode("materials")}>♻ Вторсырьё</button>
            <button className={mode === "services" ? "selected" : ""} onClick={() => changeMode("services")}>⌁ Услуги</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "materials" ? "Например, лом чёрных металлов или картон" : "Например, вывоз отходов или демонтаж"} aria-label="Поисковый запрос" />
            <button className="find" type="submit">Найти предложения →</button>
          </form>
          <div className="filters">
            <label>Категория<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories[mode].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Город или район<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Любое местоположение" /></label>
            <label className="check"><input type="checkbox" checked={pickupOnly} onChange={(event) => setPickupOnly(event.target.checked)} /> С вывозом</label>
          </div>
        </div>
        <div className="herofoot"><span>Москва и Московская область</span><span>Поиск без регистрации</span></div>
      </section>

      <section className="catalog" id="catalog">
        <div className="sectionhead">
          <div><small>КАТАЛОГ ПРЕДЛОЖЕНИЙ</small><h2>Подходящие предложения</h2></div>
          <span>{results.length} {results.length === 1 ? "предложение" : results.length > 1 && results.length < 5 ? "предложения" : "предложений"}</span>
        </div>
        <div className="catalogtools">
          <div className="quickfilters">
            {categories[mode].slice(0, 5).map((value) => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value}</button>)}
          </div>
          <label className="sort">Сортировка<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="default">По умолчанию</option><option value="pickup">Сначала с вывозом</option><option value="title">По названию</option></select></label>
        </div>
        {results.length ? <div className="cards">{results.map((item) => (
          <article className="card" key={item.id}>
            <div className="cardtop"><div className="emoji">{item.icon}</div><small>{item.category}</small></div>
            <h3>{item.title}</h3>
            <p className="place">⌖ {item.place}</p>
            <div className="price">{item.price} <small>{item.unit}</small></div>
            <p className="detail">{item.detail}</p>
            <div className="cardbottom">{item.pickup ? <span className="tag">Есть вывоз</span> : <span className="tag mutedtag">Самостоятельная доставка</span>}<span className="demo-label">Демо</span></div>
          </article>
        ))}</div> : <div className="empty"><h3>Ничего не найдено</h3><p>Попробуйте изменить запрос, категорию или местоположение.</p><button onClick={resetFilters}>Сбросить фильтры</button></div>}
        <p className="note">Все предложения на этой странице демонстрационные. Цены и условия не являются актуальными коммерческими предложениями.</p>
      </section>

      <section className="how" id="how">
        <small>ПРОСТОЙ ПУТЬ К РЕЗУЛЬТАТУ</small><h2>Меньше поиска.<br /><span>Больше пользы.</span></h2>
        <div className="steps">
          <div><b>01</b><h3>Опишите задачу</h3><p>Укажите материал или услугу, объём и местоположение.</p></div>
          <div><b>02</b><h3>Сравните варианты</h3><p>Изучите цены, условия приёма, вывоз и расстояние.</p></div>
          <div><b>03</b><h3>Выберите решение</h3><p>Свяжитесь с подходящей компанией.</p></div>
        </div>
      </section>
      <footer id="about"><a className="logo" href="#"><b>V</b> vesutil</a><span>Поиск решений для вторсырья и услуг.</span><span>© 2026 Vesutil · MVP</span></footer>
    </main>
  );
}
