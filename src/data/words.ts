/**
 * Compatibility entry point for the website game screens.
 * The implementation below is copied from PlayHome-RN's canonical, locale-aware
 * word selector; the backend uses the matching JavaScript data modules.
 */
export {
  WORDS,
  categories,
  getCategories,
  getExclusiveCategories,
  getWordDatabase,
} from "./officialWords/index";
export type { WordData } from "./officialWords/types";
