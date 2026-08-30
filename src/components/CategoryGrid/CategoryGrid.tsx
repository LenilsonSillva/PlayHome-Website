import type { CSSProperties } from "react";
import animalsImage from "../../assets/category/animals.svg?url";
import abstractImage from "../../assets/category/abstract.svg?url";
import bibleImage from "../../assets/category/bible.svg?url";
import cultureImage from "../../assets/category/culture.svg?url";
import foodImage from "../../assets/category/food.svg?url";
import historyImage from "../../assets/category/history.svg?url";
import objectsImage from "../../assets/category/objects.svg?url";
import placesImage from "../../assets/category/places.svg?url";
import professionsImage from "../../assets/category/professions.svg?url";
import scienceImage from "../../assets/category/science.svg?url";
import sportsImage from "../../assets/category/sports.svg?url";
import techImage from "../../assets/category/tech.svg?url";
import { useI18n } from "../../i18n";
import styles from "./categoryGrid.module.css";

type CategoryGridProps = {
  categories: string[];
  selectedCategories: string[];
  onToggle: (category: string) => void;
};

type CategoryVisual = {
  image: string;
  emoji: string;
  accent: string;
};

const visuals: Record<string, CategoryVisual> = {
  animals: { image: animalsImage, emoji: "✦", accent: "#ff4e88" },
  food: { image: foodImage, emoji: "◒", accent: "#ffca63" },
  science: { image: scienceImage, emoji: "◎", accent: "#55e8e0" },
  places: { image: placesImage, emoji: "⌖", accent: "#36c5b5" },
  tech: { image: techImage, emoji: "⌁", accent: "#7c6cff" },
  sports: { image: sportsImage, emoji: "◇", accent: "#7dd3fc" },
  objects: { image: objectsImage, emoji: "□", accent: "#a6b9d3" },
  history: { image: historyImage, emoji: "⌂", accent: "#ffb86b" },
  professions: { image: professionsImage, emoji: "+", accent: "#c4b5fd" },
  culture: { image: cultureImage, emoji: "◉", accent: "#b28cff" },
  bible: { image: bibleImage, emoji: "✧", accent: "#ffd166" },
  abstract: { image: abstractImage, emoji: "⊹", accent: "#9aa8c1" },
};

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getCategoryVisual(category: string, index: number): CategoryVisual {
  const value = fold(category);

  if (/animal|tierreich|regno animale|동물|動物|حيوان|पशु|питом/.test(value)) return visuals.animals;
  if (/biblia|bible|bibel|biblia|성경|聖書|الكتاب|बाइबल/.test(value)) return visuals.bible;
  if (/gastr|comida|food|essen|cibo|食|makanan|مأكولات|खान/.test(value)) return visuals.food;
  if (/cien|science|natur|wissenschaft|scienz|наук|科学|과학|विज्ञान|العلوم/.test(value)) return visuals.science;
  if (/esport|sport|deport|спорт|スポーツ|스포츠|体育|खेल|الرياضة/.test(value)) return visuals.sports;
  if (/geograf|geograph|geograf|географ|地理|지리|भूगोल|الجغراف/.test(value)) return visuals.places;
  if (/lugar|locais|places|orte|lieux|luoghi|мест|場所|장소|公共场所|स्थान|أماكن/.test(value)) return visuals.places;
  if (/digital|tecnolog|technology|tech|digitale|цифров|デジタル|디지털|数字|डिजिटल|الرقمي/.test(value)) return visuals.tech;
  if (/prof|beruf|profession|職業|직업|професс|पेशा|المهن/.test(value)) return visuals.professions;
  if (/hist|gesch|storia|истор|歴史|역사|历史|इतिहास|التاريخ/.test(value)) return visuals.history;
  if (/cinema|cine|film|tv|pop|cultura|culture|娱乐|대중문화|мир поп|大衆|मनोरंजन|بوب/.test(value)) return visuals.culture;
  if (/objet|object|gegen|oggett|предмет|物体|사물|用品|वस्तु|الأغراض/.test(value)) return visuals.objects;

  const fallbackKeys = Object.keys(visuals);
  return visuals[fallbackKeys[index % fallbackKeys.length]] ?? visuals.abstract;
}

export function CategoryGrid({ categories, selectedCategories, onToggle }: CategoryGridProps) {
  const { t } = useI18n();

  return (
    <div className={styles.grid} role="group" aria-label="Categories">
      {categories.map((category, index) => {
        const visual = getCategoryVisual(category, index);
        const selected = selectedCategories.includes(category);
        const style = {
          "--category-image": `url("${visual.image}")`,
          "--category-accent": visual.accent,
        } as CSSProperties;

        return (
          <button
            key={category}
            type="button"
            className={`${styles.card} ${selected ? styles.selected : ""}`}
            style={style}
            aria-pressed={selected}
            onClick={() => onToggle(category)}
          >
            <span className={styles.art} aria-hidden="true" />
            <span className={styles.check} aria-hidden="true">{selected ? "✓" : ""}</span>
            <span className={styles.icon} aria-hidden="true">{visual.emoji}</span>
            <span className={styles.name}>{category}</span>
            <span className={styles.state}>{selected ? t("site.selected", "SELECTED") : t("site.add", "ADD")}</span>
          </button>
        );
      })}
    </div>
  );
}
