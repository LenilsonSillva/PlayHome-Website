import { GameCard } from "../../components/GameCard/GameCard";
import { PlayerContextProvider } from "../../contexts/playersProvider";
import type { Game } from "../../types/game";
import styles from "./styles.module.css";

export default function Home() {
  const games: (Game & { icon: string; accent: string; btn: string })[] = [
    {
      id: "impostor",
      name: "Impostor",
      description:
        "Um traidor tenta sabotá-lo! Os tripulantes recebem uma palavra, menos o impostor. Ejete-o da nave.",
      minPlayers: 3,
      maxPlayers: 20,
      route: "/games/impostor/lobby",
      icon: "🤫",
      accent: "var(--danger-neon)",
      btn: "var(--button-red)",
    },
    {
      id: "secret-word",
      name: "Criptografia",
      description:
        "Comunicação tática! Dê dicas precisas para sua equipe descriptografar a palavra.",
      minPlayers: 2,
      maxPlayers: 20,
      route: "/games/secretWord/lobby",
      icon: "🔑",
      accent: "var(--tech-cyan)",
      btn: "var(--button-tech)",
    },
  ];

  return (
    <PlayerContextProvider>
      <div className={styles.pageWrapper}>
        {/* Luzes de fundo dinâmicas */}
        <div className={styles.ambientLight1} />
        <div className={styles.ambientLight2} />

        <main className={styles.homeContainer}>
          <header className={styles.hero}>
            <div className={styles.badge}>SISTEMA DE JOGOS ATIVO</div>
            <h1 className={styles.mainTitle}>
              PLAY<span>HOME</span>
            </h1>
            <p className={styles.subtitle}>
              Selecione um protocolo e inicie a diversão com seus amigos.
            </p>
          </header>

          <div className={styles.gamesGrid}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </main>
      </div>
    </PlayerContextProvider>
  );
}
