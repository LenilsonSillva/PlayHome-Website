import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayers } from "../../../../contexts/contextHook";
import { categories } from "../../../../data/words";
import type { CryptoConfig, CryptoMode } from "../GameLogistic/types";
import { loadGlobalUsedWords } from "../GameLogistic/wordStorage";
import styles from "./secreteLobby.module.css";
import { SecretWordHeader } from "../../../../components/SecretWordHeader/SecretWordHeader";

export function SecretWordLobby() {
  const navigate = useNavigate();
  const { players, addPlayer, removePlayer } = usePlayers();

  // Configurações (paridade com o LobbyOffline do PlayHome-RN)
  const [mode, setMode] = useState<CryptoMode>("infiltration");
  const [teamCount, setTeamCount] = useState(2);
  const [assignmentMode, setAssignmentMode] = useState<"random" | "manual">(
    "random",
  );
  const [name, setName] = useState("");
  const [selectedTime, setSelectedTime] = useState(60);
  const [skipLimit, setSkipLimit] = useState(3); // Infiltração (3, 5, ∞)
  const [matchLimit, setMatchLimit] = useState(5); // Interceptação (5, 10, 20)
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([
    "Objetos",
    "Animais",
    "Ciência",
    "Natureza",
    "Comida",
    "Emoções",
    "Substantivos variados",
    "Lugares",
    "Países e Cidades",
    "Tecnologia",
  ]);

  // Mapeamento manual: id do player -> index do time
  const [manualAssignments, setManualAssignments] = useState<
    Record<string, number>
  >({});

  const infiltrationTimes = [60, 90, 120];
  const interceptionTimes = [15, 30, 60];

  useEffect(() => {
    setSelectedTime(mode === "infiltration" ? 60 : 15);
  }, [mode]);

  // Sincroniza o mapa manual quando players entram ou a qtd de times muda
  useEffect(() => {
    const newAssignments = { ...manualAssignments };
    players.forEach((p) => {
      if (
        newAssignments[p.id] === undefined ||
        newAssignments[p.id] >= teamCount
      ) {
        newAssignments[p.id] = 0;
      }
    });
    setManualAssignments(newAssignments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, teamCount]);

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || players.length >= 20) return;
    addPlayer(name.trim());
    setName("");
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  };

  // Regra do RN: máximo de times = total de jogadores / 2
  const maxPossibleTeams = Math.max(2, Math.floor(players.length / 2));
  const canStart = players.length >= 4 && players.length >= teamCount * 2;

  const handleStart = () => {
    // Pelo menos 1 categoria selecionada
    if (selectedCats.length === 0) {
      alert(
        "Selecione pelo menos 1 categoria no Banco de Dados para gerar palavras.",
      );
      return;
    }

    // Validação específica para distribuição manual
    if (assignmentMode === "manual") {
      const teamCounts = new Array(teamCount).fill(0);
      players.forEach((p) => teamCounts[manualAssignments[p.id] || 0]++);
      const hasInvalidTeam = teamCounts.some((count) => count < 2);
      if (hasInvalidTeam) {
        alert(
          "Protocolo Inválido: cada esquadrão deve ter pelo menos 2 integrantes. Reduza a quantidade de grupos ou redistribua os jogadores.",
        );
        return;
      }
    }

    const config: CryptoConfig = {
      mode,
      teamCount,
      distributionType: assignmentMode,
      roundTime: selectedTime,
      wordLimit: matchLimit,
      skipLimit,
      categories: selectedCats,
    };

    const globalUsedWords = loadGlobalUsedWords();

    navigate("/games/secretWord/game", {
      state: { config, manualAssignments, globalUsedWords },
    });
  };

  return (
    <div className={styles.lobbyWrapperHeaderAndContent}>
      <SecretWordHeader mode={setMode} currentMode={mode} />

      {/* 1. EXPLICAÇÃO (Mantida) */}
      <div className={styles.lobbyWrapperContent}>
        <div className={`${styles.section} ${styles.modeInfoBox}`}>
          <div className={styles.infoIcon}>📡</div>
          <div className={styles.infoContent}>
            <h3 className={styles.infoTitle}>
              {mode === "infiltration"
                ? "PROTOCOLO INFILTRAÇÃO"
                : "PROTOCOLO INTERCEPTAÇÃO"}
            </h3>
            <p className={styles.infoText}>
              {mode === "infiltration"
                ? "Um operador recebe uma palavra e os seus colegas de equipe tentam adivinha-la. Um esquadrão por vez, acerte o máximo de palavras antes do tempo acabar."
                : "Os operadores dos esquadrões recebem a mesma palavra, cada um dá uma dica por vez, ganha quem acertar primeiro."}
            </p>
          </div>
        </div>

        {/* 2. FORMAÇÃO DE ESQUADRÕES (Apenas Opção) */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>
            DISTRIBUIÇÃO DOS JOGADORES
          </label>
          <div className={styles.segmentedControl}>
            <button
              className={`${styles.segBtn} ${assignmentMode === "random" ? styles.segActive : ""}`}
              onClick={() => setAssignmentMode("random")}
            >
              ALEATÓRIO
            </button>
            <button
              className={`${styles.segBtn} ${assignmentMode === "manual" ? styles.segActive : ""}`}
              onClick={() => setAssignmentMode("manual")}
            >
              MANUAL
            </button>
          </div>
        </div>

        {/* 3. QUANTIDADE DE ESQUADRÕES (máx = jogadores/2 — regra do RN) */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>NÚMERO DE GRUPOS</label>
          <div className={styles.counter}>
            <button
              className={styles.countBtn}
              onClick={() => setTeamCount(Math.max(2, teamCount - 1))}
            >
              -
            </button>
            <span className={styles.countDisplay}>{teamCount}</span>
            <button
              className={styles.countBtn}
              onClick={() => {
                if (teamCount < maxPossibleTeams) {
                  setTeamCount(teamCount + 1);
                } else {
                  alert(
                    "Limite atingido: são necessários pelo menos 2 jogadores por grupo.",
                  );
                }
              }}
              disabled={teamCount >= maxPossibleTeams}
              style={{ opacity: teamCount >= maxPossibleTeams ? 0.3 : 1 }}
            >
              +
            </button>
          </div>
          <p className={styles.countHint}>
            Mínimo de 2 tripulantes por grupo · máximo {maxPossibleTeams}{" "}
            {maxPossibleTeams === 1 ? "grupo" : "grupos"} com os jogadores
            atuais
          </p>
        </div>

        {/* 4. ADICIONAR JOGADORES + LISTA COM SELECT (Se manual) */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>
            TRIPULANTES ({players.length}/20)
          </label>
          <form className={styles.inputGroup} onSubmit={handleAddPlayer}>
            <input
              type="text"
              placeholder="Nome do Tripulante"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.textInput}
              maxLength={156}
            />
            <button
              type="submit"
              className={styles.addButton}
              disabled={players.length >= 20}
            >
              ADICIONAR
            </button>
          </form>

          <div className={styles.playersList}>
            {players.map((p) => (
              <div key={p.id} className={styles.playerTag}>
                <div className={styles.playerTagContent}>
                  <span className={styles.dotIndicator} />
                  <span className={styles.pName}>{p.name}</span>
                </div>

                <div className={styles.playerTagActions}>
                  {assignmentMode === "manual" && (
                    <select
                      className={styles.inlineSelect}
                      value={manualAssignments[p.id]}
                      onChange={(e) =>
                        setManualAssignments({
                          ...manualAssignments,
                          [p.id]: parseInt(e.target.value),
                        })
                      }
                    >
                      {Array.from({ length: teamCount }).map((_, i) => (
                        <option key={i} value={i}>
                          Grupo {i + 1}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => removePlayer(p.id)}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. CONFIGURAÇÕES TÉCNICAS */}
        <div className={styles.configGrid}>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>CRONÔMETRO</label>
            <div className={styles.timeOptions}>
              {(mode === "infiltration"
                ? infiltrationTimes
                : interceptionTimes
              ).map((t) => (
                <button
                  key={t}
                  className={`${styles.timeBtn} ${selectedTime === t ? styles.timeActive : ""}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {mode === "interception" ? (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                QUANTIDADE DE PALAVRAS
              </label>
              <div className={styles.timeOptions}>
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    className={`${styles.timeBtn} ${matchLimit === n ? styles.timeActive : ""}`}
                    onClick={() => setMatchLimit(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>QUANTIDADE DE PULOS</label>
              <div className={styles.timeOptions}>
                {[3, 5, 999].map((n) => (
                  <button
                    key={n}
                    className={`${styles.timeBtn} ${skipLimit === n ? styles.timeActive : ""}`}
                    onClick={() => setSkipLimit(n)}
                  >
                    {n <= 5 ? n : "∞"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <label className={styles.sectionLabel}>BANCO DE DADOS</label>
            <button
              className={`${styles.catToggle} ${showCategories ? styles.catOpen : ""}`}
              onClick={() => setShowCategories(!showCategories)}
            >
              {showCategories ? "FECHAR" : "CATEGORIAS"}
            </button>
          </div>
        </div>

        {showCategories && (
          <div className={styles.catGrid}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.catItem} ${selectedCats.includes(cat) ? styles.catActive : ""}`}
                onClick={() =>
                  setSelectedCats((prev) =>
                    prev.includes(cat)
                      ? prev.filter((c) => c !== cat)
                      : [...prev, cat],
                  )
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <button
          className={styles.startBtn}
          disabled={!canStart}
          onClick={handleStart}
        >
          {canStart
            ? "INICIALIZAR MISSÃO"
            : "MÍNIMO DE 4 TRIPULANTES (2 POR GRUPO)"}
        </button>
      </div>
    </div>
  );
}
