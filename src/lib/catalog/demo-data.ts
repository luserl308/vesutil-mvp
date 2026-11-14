import type { CatalogCategory, CatalogOffer } from "./types";

export const categories: CatalogCategory[] = [
  { id: "metals", kind: "material", name: "Металлолом", slug: "metallolom" },
  { id: "plastic", kind: "material", name: "Пластик", slug: "plastik" },
  { id: "glass", kind: "material", name: "Стекло", slug: "steklo" },
  { id: "paper", kind: "material", name: "Макулатура и картон", slug: "paper-cardboard" },
  { id: "electronics", kind: "material", name: "Электронные отходы", slug: "elektronnye-othody" },
  { id: "construction-waste", kind: "material", name: "Строительные отходы", slug: "stroitelnye-othody" },
  { id: "transport", kind: "service", name: "Вывоз и транспортировка", slug: "vyvoz-transportirovka" },
  { id: "demolition", kind: "service", name: "Демонтаж и снос", slug: "demolition" },
  { id: "equipment", kind: "service", name: "Аренда спецтехники", slug: "arenda-spectehniki" },
  { id: "loading", kind: "service", name: "Погрузка и разгрузка", slug: "pogruzka-razgruzka" },
];

export const offers: CatalogOffer[] = [
  { id: "demo-1", kind: "material", title: "Приём лома чёрных металлов", category: "Металлолом", categorySlug: "metal-scrap", location: "Москва, Южный округ", priceLabel: "от 18 000", unit: "₽ / тонна", description: "Самовывоз от 1 тонны · Оплата на месте", pickupAvailable: true, icon: "♻️", keywords: ["чёрный металл", "лом", "сталь", "железо"], demo: true },
  { id: "demo-2", kind: "material", title: "Покупка картона и макулатуры", category: "Макулатура и картон", categorySlug: "paper-cardboard", location: "Химки, Московская область", priceLabel: "до 12 000", unit: "₽ / тонна", description: "Принимаем прессованный картон и россыпью", pickupAvailable: true, icon: "📦", keywords: ["бумага", "картон", "гофрокартон"], demo: true },
  { id: "demo-3", kind: "material", title: "Приём ПЭТ-бутылки", category: "Пластик", categorySlug: "plastic", location: "Люберцы, Московская область", priceLabel: "до 28", unit: "₽ / кг", description: "Прозрачный сортированный ПЭТ", pickupAvailable: false, icon: "🧴", keywords: ["пэт", "пластик", "бутылка"], demo: true },
  { id: "demo-4", kind: "material", title: "Приём стеклобоя", category: "Стекло", categorySlug: "glass", location: "Подольск, Московская область", priceLabel: "По запросу", unit: null, description: "Условия приёма зависят от цвета и степени сортировки", pickupAvailable: false, icon: "🍾", keywords: ["стекло", "бой", "стеклобой"], demo: true },
  { id: "demo-5", kind: "service", title: "Вывоз строительных отходов", category: "Вывоз и транспортировка", categorySlug: "waste-transport", location: "Москва и область", priceLabel: "от 8 500", unit: "₽ / рейс", description: "Контейнеры 8–27 м³ · Подача по заявке", pickupAvailable: true, icon: "🚛", keywords: ["контейнер", "строительный мусор", "вывоз отходов"], demo: true },
  { id: "demo-6", kind: "service", title: "Демонтаж и разборка зданий", category: "Демонтаж и снос", categorySlug: "demolition", location: "Москва и Московская область", priceLabel: "По запросу", unit: null, description: "Оценка объёма работ и выезд специалиста", pickupAvailable: false, icon: "🏗️", keywords: ["снос", "разборка", "здание"], demo: true },
  { id: "demo-7", kind: "service", title: "Аренда экскаватора-погрузчика", category: "Аренда спецтехники", categorySlug: "equipment-rental", location: "Балашиха, Московская область", priceLabel: "от 2 500", unit: "₽ / час", description: "Оператор включён · Минимум 4 часа", pickupAvailable: false, icon: "🚜", keywords: ["экскаватор", "погрузчик", "техника"], demo: true },
  { id: "demo-8", kind: "service", title: "Погрузка и вывоз металлолома", category: "Погрузка и разгрузка", categorySlug: "loading-unloading", location: "Москва, Северный округ", priceLabel: "По запросу", unit: null, description: "Погрузочная техника и транспорт по согласованию", pickupAvailable: true, icon: "🏭", keywords: ["металл", "погрузка", "лом"], demo: true },
];