import { useCallback, useEffect, useRef, useState } from "react";
import type { CryptoView } from "../../../../../types/cryptoOnline";
import { Scoreboard, TeamMembers } from "./shared";
import { CryptoHud } from "../../components/CryptoHud";
import { WordRevealBox } from "../../components/WordRevealBox";
import successSfx from "../../../../../assets/sounds/success.wav";
import skipSfx from "../../../../../assets/sounds/skip.mp3";
import alertSfx from "../../../../../assets/sounds/alert.wav";
import endSfx from "../../../../../assets/sounds/end.wav";
import silentWav from "../../../../../assets/sounds/silent.wav";
import { useIOSAudioUnlock } from "../../../../../hooks/useIOSAudioUnlock";
import styles from "../onlineCrypto.module.css";
import { useI18n } from "../../../../../i18n";

type Props = {
  view: CryptoView;
  emit: (event: string, payload?: unknown) => void;
};

export function OnlineInterceptionAction({ view, emit }: Props) {
  const { t } = useI18n();
  const currentTeam = view.teams[view.currentTeamIndex];
  const running = view.roundEndTime != null;
  const isController = view.controls.canControl;
  const actingPlayerId = view.actingPlayerId ?? view.myPlayerId;
  const isOperator = view.teams.some(
    (team) => team.operatorId === actingPlayerId,
  );
  const [timeLeft, setTimeLeft] = useState(view.config.roundTime);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasViewedWord, setHasViewedWord] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "success" | "fail">("none");
  const alertFired = useRef(false);
  const endFired = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initAudio, playSound } = useIOSAudioUnlock(
    {
      success: successSfx,
      skip: skipSfx,
      alert: alertSfx,
      end: endSfx,
    },
    silentWav,
  );

  // O servidor encerra a vez. O contador local só reproduz os
  // mesmos alertas do modo offline para o operador que está jogando.
  useEffect(() => {
    if (!view.roundEndTime) {
      setTimeLeft(view.config.roundTime);
      alertFired.current = false;
      endFired.current = false;
      return;
    }

    const endTime = view.roundEndTime;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 3 && !alertFired.current) {
        alertFired.current = true;
        if (isController) playSound("alert");
      }

      if (remaining <= 0 && !endFired.current) {
        endFired.current = true;
        clearInterval(interval);
        if (isController) playSound("end");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [view.roundEndTime, view.config.roundTime, isController, playSound]);

  // Uma nova palavra ou uma nova vez exige que o operador a revele
  // novamente antes de confirmar uma resposta.
  useEffect(() => {
    setHasViewedWord(false);
    setIsRevealing(false);
  }, [view.currentWord, view.currentTeamIndex]);

  const flash = useCallback(
    (type: "success" | "fail") => {
      setFeedback(type);
      if (type === "success") {
        playSound("success");
        if ("vibrate" in navigator) navigator.vibrate(200);
      } else {
        playSound("skip");
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      }
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback("none"), 300);
    },
    [playSound],
  );

  const handlePointerDown = useCallback(() => {
    initAudio();
    setHasViewedWord(true);
    setIsRevealing(true);
  }, [initAudio]);

  const handlePointerUp = useCallback(() => {
    setIsRevealing(false);
  }, []);

  const startTurnTimer = () => {
    if (!view.controls.canStartTimer || !hasViewedWord) return;
    initAudio();
    playSound("alert");
    emit("crypto:start-timer", { roomCode: view.roomCode });
  };

  const handleWin = () => {
    if (isProcessing || !hasViewedWord) return;
    setIsProcessing(true);
    flash("success");
    // Pequeno atraso para preservar o feedback visual/sonoro do offline.
    setTimeout(() => {
      emit("crypto:interception-result", {
        roomCode: view.roomCode,
        winnerTeamIndex: view.currentTeamIndex,
      });
      setIsProcessing(false);
    }, 400);
  };

  const handlePass = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    flash("fail");
    setTimeout(() => {
      emit("crypto:pass-turn", { roomCode: view.roomCode });
      setIsProcessing(false);
    }, 300);
  };

  const requestWordChange = () => {
    if (!view.controls.canRequestWordChange && !view.controls.canReroll) return;
    initAudio();
    emit("crypto:reroll-word", { roomCode: view.roomCode });
  };

  const approveWordChange = () => {
    const request = view.wordChangeRequest;
    if (!request || !view.controls.canApproveWordChange) return;
    initAudio();
    emit("crypto:approve-reroll-word", {
      roomCode: view.roomCode,
      requestId: request.id,
    });
  };

  const rejectWordChange = () => {
    const request = view.wordChangeRequest;
    if (!request || !view.controls.canRejectWordChange) return;
    initAudio();
    emit("crypto:reject-reroll-word", {
      roomCode: view.roomCode,
      requestId: request.id,
    });
  };

  const operator = currentTeam.players.find(
    (p) => p.id === currentTeam.operatorId,
  );
  const waitingWord = view.currentWordVisible ? view.currentWord : null;
  const request = view.wordChangeRequest;
  const myId = actingPlayerId;
  const hasApproved = !!request && !!myId && request.approvedBy.includes(myId);
  const agreedOperators = request?.approvedBy.length ?? 0;
  const totalOperators = request?.operatorIds.length ?? 0;

  const wordPanel = (
    <WordRevealBox
      word={view.currentWord}
      hasStarted={hasViewedWord}
      isRevealing={isRevealing}
      feedback={feedback}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );

  return (
    <div className={styles.container}>
      {/* PROGRESSO DA PARTIDA */}
      <div className={styles.matchProgress}>
        <span>
          {t("games.cryptography_action_wordOf", "WORD")} {view.currentMatchIndex + 1} {t("games.cryptography_action_of", "OF")} {view.config.wordLimit}
        </span>
        <div className={styles.progressBg}>
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.min(
                (view.currentMatchIndex / Math.max(view.config.wordLimit, 1)) *
                  100,
                100,
              )}%`,
            }}
          />
        </div>
      </div>

      <CryptoHud
        label={t("games.cryptography_action_turnOf", "TURN OF")}
        teamName={currentTeam.name}
        teamColor={currentTeam.color}
        operatorName={operator?.name ?? "---"}
        stats={[{ text: "✅", value: currentTeam.roundScore, tone: "success" }]}
        countdown={running ? timeLeft : null}
        totalTime={view.config.roundTime}
      />

      {request ? (
        /* ================= CONSENSO DOS OPERADORES ================= */
        <div className={styles.waitingPanel}>
          <span className={styles.waitingIcon}>🗳️</span>
          <h2>{t("games.cryptography_action_wordChangeRequested", "WORD CHANGE REQUESTED")}</h2>
          <p className={styles.waitingSub}>
            <strong>{request.requesterName}</strong> {t("games.cryptography_action_requestedNewWord", "requested a new word.")} {t("games.cryptography_action_changeNeedsConsensus", "The change happens only when all operators accept.")}
          </p>

          <div className={styles.wordPeek}>
            {waitingWord ? (
              <>
                <span className={styles.wordPeekLabel}>{t("games.cryptography_action_contestedWord", "WORD UNDER REVIEW")}</span>
                <span className={styles.wordPeekValue}>{waitingWord}</span>
              </>
            ) : (
              <span className={styles.wordPeekHidden}>
                🔒 {t("games.cryptography_action_wordVisibilityRules", "Word visibility follows the match rules")}
              </span>
            )}
          </div>

          <div className={styles.consensusStatus}>
            {agreedOperators} / {totalOperators} {t("games.cryptography_action_operatorsAgreed", "OPERATORS AGREED")}
          </div>

          {view.controls.canApproveWordChange ||
          view.controls.canRejectWordChange ? (
            <div className={styles.consensusActions}>
              {view.controls.canApproveWordChange && (
                <button className={styles.primaryBtn} onClick={approveWordChange}>
                  ✅ {t("games.cryptography_action_acceptChange", "ACCEPT CHANGE")}
                </button>
              )}
              {view.controls.canRejectWordChange && (
                <button className={styles.rejectBtn} onClick={rejectWordChange}>
                  ❌ {t("games.cryptography_action_rejectContinue", "REJECT AND CONTINUE")}
                </button>
              )}
            </div>
          ) : request.requesterId === myId ? (
            <p className={styles.waitingNote}>
              ✅ {t("games.cryptography_action_requestRegistered", "Request registered. Waiting for the other operators...")}
            </p>
          ) : hasApproved ? (
            <p className={styles.waitingNote}>
              ✅ {t("games.cryptography_action_alreadyAccepted", "You already accepted. Waiting for the other operators...")}
            </p>
          ) : (
            <p className={styles.waitingNote}>
              ⏳ {t("games.cryptography_action_waitingConsensus", "Waiting for the operators to accept the change...")}
            </p>
          )}

          <TeamMembers team={currentTeam} />
          <Scoreboard teams={view.teams} />
        </div>
      ) : isController ? (
        /* ================= OPERADOR DA VEZ ================= */
        <div className={styles.actionArea}>
          {wordPanel}

          {!running ? (
            <div className={styles.actionRow}>
              <button
                className={styles.ghostBtn}
                onClick={requestWordChange}
                disabled={
                  !view.controls.canRequestWordChange &&
                  !view.controls.canReroll
                }
              >
                🔄 {t("games.cryptography_action_requestChange", "REQUEST CHANGE")}
              </button>
              <button
                className={styles.bigCyanBtn}
                onClick={startTurnTimer}
                disabled={!view.controls.canStartTimer || !hasViewedWord}
              >
                ⏱️ {t("games.cryptography_action_hintGivenBtn", "HINT GIVEN! START TIMER")}
              </button>
            </div>
          ) : (
            <div className={styles.actionRow}>
              <button
                className={styles.dangerBtn}
                onClick={handlePass}
                disabled={isProcessing || !view.controls.canPassTurn}
              >
                ❌ {t("games.cryptography_action_missPassBtn", "MISSED / PASS")}
              </button>
              <button
                className={styles.successBtn}
                onClick={handleWin}
                disabled={
                  !hasViewedWord || isProcessing || !view.controls.canControl
                }
              >
                {t("games.cryptography_action_winBtn", "CORRECT! 🏆")}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= QUEM ESPERA ================= */
        <div className={styles.waitingPanel}>
          <span className={styles.waitingIcon}>⚠️</span>
          <h2>{t("games.cryptography_action_stayAlert", "STAY ALERT")}</h2>
          <p className={styles.waitingSub}>
            {t("games.cryptography_action_group", "Group")} {" "}
            <strong style={{ color: currentTeam.color }}>
              {currentTeam.name}
            </strong>{" "}
            {t("games.cryptography_action_tryingIntercept", "is trying to intercept the word")}
          </p>

          <div className={styles.wordPeek}>
            {waitingWord ? (
              <>
                <span className={styles.wordPeekLabel}>{t("games.cryptography_action_contestedWord", "WORD UNDER REVIEW")}</span>
                <span className={styles.wordPeekValue}>{waitingWord}</span>
              </>
            ) : (
              <span className={styles.wordPeekHidden}>
                🔒 {t("games.cryptography_action_onlyOperatorSees", "Only the current operator sees the word now")}
              </span>
            )}
          </div>

          {isOperator && !running && (
            <button
              className={styles.ghostBtn}
              onClick={requestWordChange}
              disabled={
                !view.controls.canRequestWordChange && !view.controls.canReroll
              }
            >
              🔄 {t("games.cryptography_action_requestWordChange", "REQUEST WORD CHANGE")}
            </button>
          )}

          <TeamMembers team={currentTeam} />
          <Scoreboard teams={view.teams} />
        </div>
      )}
    </div>
  );
}
