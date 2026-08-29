// Persistência das palavras usadas (paridade com o wordStorage do RN):
// o jogo evita repetir palavras entre partidas na sessão/dispositivo.

const STORAGE_KEY = "playhome_crypto_used_words";

export function loadGlobalUsedWords(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((w) => typeof w === "string") : [];
  } catch {
    return [];
  }
}

export function saveGlobalUsedWords(words: string[]): void {
  try {
    if (words.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }
  } catch {
    // storage cheio/indisponível — ignora silenciosamente
  }
}
