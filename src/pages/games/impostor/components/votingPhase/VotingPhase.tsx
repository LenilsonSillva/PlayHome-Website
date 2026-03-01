import { useState, useEffect, useRef } from "react";
import "./votingPhase.css";
import { PlayerAvatar } from "../../../../../components/PlayerAvatar/PlayerAvatar";
import impostorSd from "./../../../../../assets/sounds/impostor.mp3";
import votingSd from "./../../../../../assets/sounds/skip.mp3";

type VotingProps = {
  data: any; // Aceita GameRouteState["data"] ou o objeto do Socket
  onEliminate: (id: string | null) => void;
  isOnline: boolean;
};

export function VotingPhase({ data, onEliminate, isOnline }: VotingProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [votes, setVotes] = useState<{ voter: string; voted: string }[]>([]);
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [finished, setFinished] = useState(false);
  const [hasVotedOnline, setHasVotedOnline] = useState(false);

  const playersList = data.players || data.allPlayers || [];
  const alivePlayers = playersList.filter((p: any) => p.isAlive);

  // Identifica o votante atual
  // Offline: segue o índice | Online: é o jogador local (myName)
  const currentVoter = isOnline
    ? alivePlayers.find((p: any) => p.name === data.myName)
    : alivePlayers[currentVoterIdx];

  const impostorSound = useRef(new Audio(impostorSd));
  const votingSound = useRef(new Audio(votingSd));

  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const triggerFeedback = (type: "isImpostor") => {
    if (type === "isImpostor") {
      playSound(impostorSound);
      if ("vibrate" in navigator) navigator.vibrate(200);
    }
  };

  useEffect(() => {
    // Se a fase mudar para result no online, finalizamos a tela localmente

    if (isOnline && data.votingFinished) {
      setFinished(true);
    }

    if (finished) {
      const eliminatedId = getEliminatedPlayer();
      const eliminatedPlayer = alivePlayers.find(
        (p: any) => p.id === eliminatedId,
      );
      if (eliminatedPlayer?.isImpostor) triggerFeedback("isImpostor");
      return;
    }

    if (seconds === 0) {
      handleVote(null);
      return;
    }

    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds, finished, data.votingFinished, isOnline]);

  function handleVote(votedId: string | null) {
    playSound(votingSound);

    if (isOnline) {
      setHasVotedOnline(true);
      onEliminate(votedId);
    } else {
      setVotes((prev) => [
        ...prev,
        { voter: currentVoter.id, voted: votedId || "NULO" },
      ]);
      if (currentVoterIdx < alivePlayers.length - 1) {
        setCurrentVoterIdx(currentVoterIdx + 1);
        setSeconds(60);
      } else {
        setFinished(true);
      }
    }
  }

  function getEliminatedPlayer() {
    // No online, o backend geralmente já processou quem morreu,
    // mas para manter o Card, buscamos quem acabou de ficar isAlive: false
    if (isOnline) {
      // Se houver um objeto de votos vindo do servidor, usamos ele, senão buscamos o morto
      if (isOnline) {
        if (!data.votingFinished) return null;

        const voteCount: Record<string, number> = {};
        Object.values(data.votes || {}).forEach((id: any) => {
          if (id && id !== "NULO") voteCount[id] = (voteCount[id] || 0) + 1;
        });

        let max = 0;
        let candidates: string[] = [];

        Object.entries(voteCount).forEach(([id, count]) => {
          if (count > max) {
            max = count;
            candidates = [id];
          } else if (count === max) {
            candidates.push(id);
          }
        });

        return candidates.length === 1 ? candidates[0] : null;
      }
    }

    const voteCount: Record<string, number> = {};
    votes.forEach((v) => {
      if (v.voted !== null)
        voteCount[v.voted] = (voteCount[v.voted] || 0) + 1;
    });

    let maxVotes = 0;
    let candidates: string[] = [];
    Object.entries(voteCount).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [id];
      } else if (count === maxVotes) candidates.push(id);
    });

    return candidates.length !== 1 || maxVotes === 0 ? null : candidates[0];
  }

  // --- TELA DE ESPERA ONLINE ---
  if (isOnline && hasVotedOnline && !finished && currentVoter) {
    return (
      <div className="waitscreen-container main-bg">
        <div className="glass-panel result-container wait-panel">
          <h2 className="tech-title">VOTO REGISTRADO</h2>

          <div className="wait-avatar-box">
            <PlayerAvatar
              emoji={data.myEmoji}
              color={data.myColor}
              size={100}
            />
            <p className="wait-main-text">Sinal transmitido com sucesso.</p>
            <p className="wait-sub-text">Aguardando outros tripulantes...</p>
          </div>

          <div className="voting-progress-list">
            <h3 className="progress-title">STATUS DOS RECEPTORES</h3>
            <div className="progress-grid">
              {alivePlayers.map((p: any) => (
                <div
                  key={p.id}
                  className={`progress-item ${p.voted ? "voted" : "pending"}`}
                >
                  <div className="status-led"></div>
                  <span className="p-name">{p.name}</span>
                  <span className="p-status">{p.voted ? "OK" : "⏳"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA DE RESULTADOS (MANTIDA IGUAL AO SEU MODELO) ---
  if (finished) {
    const eliminatedId = getEliminatedPlayer();
    const eliminatedPlayer = data.players.find(
      (p: any) => p.id === eliminatedId,
    );

    const voteCount: Record<string, number> = {};
    // No online, as barras podem ser baseadas no resultado final se o servidor enviar os votos
    const votesSource =
      isOnline && data.votes
        ? Object.entries(data.votes).map(([voter, voted]) => ({
            voter,
            voted: voted as string,
          }))
        : votes;

    votesSource.forEach((v) => {
      if (v.voted !== null)
        voteCount[v.voted] = (voteCount[v.voted] || 0) + 1;
    });

    const playerRole = [
      "Engenheiro de Dobra",
      "Xenobiologista",
      "Piloto de Fuga",
      "Técnico de O2",
      "Cientista de Dados",
    ][(eliminatedPlayer?.name.length || 0) % 5];
    const serialNumber = `SN-${eliminatedId?.slice(0, 4).toUpperCase() || "NULL"}`;

    function handleResult() {
      if (!isOnline && eliminatedId) {
        const idx = data.players.findIndex((p: any) => p.id === eliminatedId);
        if (idx !== -1) data.players[idx].isAlive = false;
      }
      onEliminate(eliminatedId);
    }

    const playersForSummary =
      isOnline && eliminatedPlayer
        ? [...alivePlayers, eliminatedPlayer]
        : alivePlayers;

    return (
      <div className="main-bg voting-screen">
        <div className="glass-panel result-container">
          <h2 className="tech-title">RELATÓRIO DE VOTAÇÃO</h2>

          {(!isOnline && eliminatedPlayer) ||
          (isOnline && eliminatedPlayer && eliminatedPlayer.voted) ? (
            <div className="id-card" style={{ marginBottom: "30px" }}>
              <div
                className="id-card-header"
                style={{ backgroundColor: eliminatedPlayer.color }}
              >
                <span>REGISTRO DE SEGURANÇA</span>
                <span>{serialNumber}</span>
              </div>
              <div className="id-card-body">
                <div className="id-avatar-wrapper">
                  <PlayerAvatar
                    emoji={eliminatedPlayer.emoji}
                    color={eliminatedPlayer.color}
                    size={80}
                  />
                </div>
                <div className="id-info">
                  <div className="info-group">
                    <label>NOME</label>
                    <p className="info-value">
                      {eliminatedPlayer.name.toUpperCase()}
                    </p>
                  </div>
                  <div className="info-row">
                    <div className="info-group">
                      <label>FUNÇÃO</label>
                      {eliminatedPlayer.isImpostor ? (
                        <p
                          style={{ color: "var(--danger-neon)" }}
                          className="info-value"
                        >
                          IMPOSTOR
                        </p>
                      ) : (
                        <p className="info-value">{playerRole}</p>
                      )}
                    </div>
                    <div className="info-group">
                      <label>STATUS</label>
                      <p
                        className="info-value"
                        style={{ color: "var(--danger-neon)" }}
                      >
                        TERMINATED
                      </p>
                    </div>
                  </div>
                  <div className="info-group">
                    <label>DATA/HORA DO REGISTRO</label>
                    <p className="info-value">
                      {new Date().toLocaleDateString()} |{" "}
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="id-stamp">ELIMINADO</div>
            </div>
          ) : (
            <div className="neutral-card">
              <h3 className="no-elimination">EMPATE: NINGUÉM FOI ELIMINADO</h3>
              <p>O Protocolo de Segurança permanece intacto.</p>
            </div>
          )}

          <div className="vote-summary">
            {playersForSummary.map((p: any) => (
              <div key={p.id} className="summary-item">
                <span className="player-name-label">{p.name}</span>
                <div className="vote-bar-bg">
                  <div
                    className="vote-bar-fill"
                    style={{
                      width: `${((voteCount[p.id] || 0) / (isOnline ? playersForSummary.length : alivePlayers.length)) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="vote-qty">{voteCount[p.id] || 0}</span>
              </div>
            ))}
          </div>

          <div className="actions-gap">
            {/* BOTÃO LOGS: APENAS OFFLINE */}
            {!isOnline && (
              <>
                <button
                  className="secondary-btn"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "OCULTAR LOGS" : "VER LOGS DE SISTEMA"}
                </button>
                {showDetails && (
                  <div className="logs-area">
                    {votes.map((v, idx) => (
                      <p key={idx} className="log-entry">
                        &gt;{" "}
                        {alivePlayers.find((p: any) => p.id === v.voter)?.name}{" "}
                        VOTOU EM{" "}
                        {v.voted === null
                          ? "NULO"
                          : alivePlayers.find((p: any) => p.id === v.voted)
                              ?.name}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              className="primary-btn"
              onClick={handleResult}
              disabled={isOnline && !data.isHost}
            >
              {isOnline && !data.isHost ? "AGUARDANDO LÍDER..." : "PROSSEGUIR"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA DE VOTAÇÃO ATIVA ---
  return (
    <div className="main-bg voting-screen">
      <div className="glass-panel voting-container">
        <div className="voting-header">
          <div className="timer-circle">
            {!isOnline || (isOnline && currentVoter) ? (
              <span
                key={seconds <= 10 ? "critical" : "normal"}
                className={seconds <= 10 ? "critical" : ""}
              >
                {seconds}s
              </span>
            ) : (
              <span key="normal" className="">
                0
              </span>
            )}
          </div>
          <div className="voter-info">
            <p className="label">
              {isOnline ? "SUA IDENTIDADE" : "VOTANDO AGORA"}
            </p>
            <h2 className="current-voter-name">
              {isOnline ? data.myName : currentVoter?.name}
            </h2>
          </div>
        </div>

        <p className="instruction">
          {!isOnline
            ? "Selecione o suspeito para ejetar da nave"
            : currentVoter
              ? "Selecione o suspeito para ejetar da nave"
              : "Você foi eliminado, aguarde a próxima rodada."}
        </p>
        {!isOnline || (isOnline && currentVoter) ? (
          <>
            <div className="players-grid">
              {alivePlayers
                .filter((p: any) => p.id !== currentVoter?.id)
                .map((p: any) => (
                  <button
                    key={p.id}
                    className="player-vote-card"
                    onClick={() => handleVote(p.id)}
                  >
                    <span className="player-emoji">{p.emoji}</span>
                    <span className="player-name">{p.name}</span>
                    <div className="vote-hover-overlay">VOTAR</div>
                  </button>
                ))}
            </div>

            <button className="null-btn" onClick={() => handleVote(null)}>
              ABSTER-SE / VOTO NULO
            </button>
          </>
        ) : null}
        <div className="voted-status">
          <p className="status-title">
            {isOnline
              ? isOnline && currentVoter
                ? "CONFIRMAÇÃO DE SINAL"
                : null
              : "STATUS DA TRIPULAÇÃO"}
          </p>
          <div className="status-dots">
            {!isOnline || (isOnline && currentVoter) ? (
              alivePlayers.map((p: any) => (
                <div
                  key={p.id}
                  className={`dot ${isOnline ? (p.voted ? "active" : "") : votes.some((v) => v.voter === p.id) ? "active" : ""}`}
                  title={p.name}
                ></div>
              ))
            ) : (
              <div
                className="voting-progress-list"
                style={{ borderTop: "none" }}
              >
                <h3 className="progress-title">STATUS DOS RECEPTORES</h3>
                <div className="progress-grid">
                  {alivePlayers.map((p: any) => (
                    <div
                      key={p.id}
                      className={`progress-item ${p.voted ? "voted" : "pending"}`}
                    >
                      <div className="status-led"></div>
                      <span className="p-name">{p.name}</span>
                      <span className="p-status">{p.voted ? "OK" : "⏳"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
