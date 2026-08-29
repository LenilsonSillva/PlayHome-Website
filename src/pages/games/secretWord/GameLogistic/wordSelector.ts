import type { WordData } from "../../../../data/words";
import { WORDS } from "../../../../data/words";

// Porta do wordSelector do PlayHome-RN: sorteia palavra única da categoria,
// com reset do pool e proteção contra repetição imediata.
export function getUniqueWord(
  selectedCategories: string[],
  usedWordsArray: string[],
  wordDatabase: WordData[] = WORDS,
): { word: string | null; didReset: boolean } {
  const usedSet = new Set(usedWordsArray);
  const filteredWords = wordDatabase.filter((w) =>
    selectedCategories.includes(w.category),
  );

  // A última palavra usada (evita repetição imediata no reset)
  const lastWord =
    usedWordsArray.length > 0 ? usedWordsArray[usedWordsArray.length - 1] : null;

  const availableWords = filteredWords.filter((w) => !usedSet.has(w.word));
  let didReset = false;
  let pool = availableWords;

  if (availableWords.length === 0) {
    // Resetou: pega todas as palavras da categoria, menos a que acabou de sair
    pool = filteredWords.filter((w) => w.word !== lastWord);

    // Segurança: categoria com 1 palavra só
    if (pool.length === 0) pool = filteredWords;

    didReset = true;
  }

  if (pool.length === 0) return { word: null, didReset };

  const randomIndex = Math.floor(Math.random() * pool.length);
  return { word: pool[randomIndex].word, didReset };
}
