// src/games/common/data/words/index.ts
import { WORDS_BR, WORDS_PT, EXCLUSIVE_CATEGORIES_PT } from "./portuguese";
import { WORDS_US, WORDS_GB, EXCLUSIVE_CATEGORIES_EN } from "./english";
import { WORDS_ES, WORDS_LATAM, EXCLUSIVE_CATEGORIES_ES } from "./spanish";
import { WORDS_FR, EXCLUSIVE_CATEGORIES_FR } from "./french";
import { WORDS_DE, EXCLUSIVE_CATEGORIES_DE } from "./german";
import { WORDS_IT, EXCLUSIVE_CATEGORIES_IT } from "./italian";
import { WORDS_RU, EXCLUSIVE_CATEGORIES_RU } from "./russian";
import { WORDS_KO, EXCLUSIVE_CATEGORIES_KO } from "./korean";
import { WORDS_JA, EXCLUSIVE_CATEGORIES_JA } from "./japanese";
import { WORDS_ZH, EXCLUSIVE_CATEGORIES_ZH } from "./chinese";
import { WORDS_HI, EXCLUSIVE_CATEGORIES_HI } from "./hindi";
import { WORDS_AR, EXCLUSIVE_CATEGORIES_AR } from "./arabic";
import type { WordData } from "./types";

// Re-export para compatibilidade
export type { WordData } from "./types";

// Função Pura: Ela apenas recebe uma string e retorna o banco.
// Não depende de nenhum outro arquivo do sistema.
export const getWordDatabase = (lang: string): WordData[] => {
  if (!lang) return WORDS_US;

  const base = lang.split("-")[0];

  switch (lang) {
    case "pt-PT":
      return WORDS_PT;
    case "en-GB":
      return WORDS_GB;
    case "es-419":
      return WORDS_LATAM;
    default:
      switch (base) {
        case "pt":
          return WORDS_BR;
        case "en":
          return WORDS_US;
        case "es":
          return WORDS_ES;
        case "fr":
          return WORDS_FR;
        case "de":
          return WORDS_DE;
        case "it":
          return WORDS_IT;
        case "ru":
          return WORDS_RU;
        case "ko":
          return WORDS_KO;
        case "ja":
          return WORDS_JA;
        case "zh":
          return WORDS_ZH;
        case "hi":
          return WORDS_HI;
        case "ar":
          return WORDS_AR;
        default:
          return WORDS_US;
      }
  }
};

// Função para extrair categorias exclusivas de um banco de palavras

export const getExclusiveCategories = (lang: string): string[] => {
  if (!lang) return EXCLUSIVE_CATEGORIES_EN;

  const base = lang.split("-")[0];

  switch (lang) {
    case "pt-PT":
      return EXCLUSIVE_CATEGORIES_PT;

    case "en-GB":
      return EXCLUSIVE_CATEGORIES_EN;

    case "es-419":
      return EXCLUSIVE_CATEGORIES_ES;

    default:
      switch (base) {
        case "pt":
          return EXCLUSIVE_CATEGORIES_PT;

        case "en":
          return EXCLUSIVE_CATEGORIES_EN;

        case "es":
          return EXCLUSIVE_CATEGORIES_ES;

        case "fr":
          return EXCLUSIVE_CATEGORIES_FR;

        case "de":
          return EXCLUSIVE_CATEGORIES_DE;

        case "it":
          return EXCLUSIVE_CATEGORIES_IT;

        case "ru":
          return EXCLUSIVE_CATEGORIES_RU;

        case "ko":
          return EXCLUSIVE_CATEGORIES_KO;

        case "ja":
          return EXCLUSIVE_CATEGORIES_JA;

        case "zh":
          return EXCLUSIVE_CATEGORIES_ZH;

        case "hi":
          return EXCLUSIVE_CATEGORIES_HI;

        case "ar":
          return EXCLUSIVE_CATEGORIES_AR;

        default:
          return EXCLUSIVE_CATEGORIES_EN;
      }
  }
};

// Função para extrair categorias de um banco de palavras
export const getCategories = (wordDatabase: WordData[]): string[] => {
  return Array.from(new Set(wordDatabase.map((w) => w.category))).sort();
};

// Para compatibilidade com código antigo que importa WORDS do index
// Usamos o banco padrão em inglês
export const WORDS = WORDS_US;

// Para compatibilidade, exportar as categorias do banco padrão
export const categories = getCategories(WORDS_US);
