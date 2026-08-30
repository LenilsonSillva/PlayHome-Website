type Translator = (key: string, fallback?: string) => string;

/**
 * Socket errors are deliberately kept locale-neutral in the backend. The
 * browser turns those stable messages into the selected language here while
 * preserving dynamic names and limits where they are useful to the player.
 */
export function translateCryptoError(
  message: string | undefined,
  t: Translator,
): string {
  if (!message) return t("alerts.error", "Something went wrong.");

  const groupPlayers = message.match(
    /^Group "(.+)" needs at least (\d+) players$/,
  );
  if (groupPlayers) {
    return `${t("errors.group", "Group")} "${groupPlayers[1]}" ${t(
      "errors.needsAtLeast",
      "needs at least",
    )} ${groupPlayers[2]} ${t("errors.players", "players")}`;
  }

  const groupOnline = message.match(
    /^Group "(.+)" needs at least one online player$/,
  );
  if (groupOnline) {
    return `${t("errors.group", "Group")} "${groupOnline[1]}" ${t(
      "errors.needsOnlinePlayer",
      "needs at least one online player",
    )}`;
  }

  const missingManual = message.match(
    /^Players without a group in manual mode: (.+)$/,
  );
  if (missingManual) {
    return `${t(
      "errors.playersWithoutGroup",
      "Players without a group in manual mode:",
    )} ${missingManual[1]}`;
  }

  const groupLimit = message.match(/^The limit of (\d+) groups has been reached$/);
  if (groupLimit) {
    return `${t("errors.groupLimit", "The limit of")} ${groupLimit[1]} ${t(
      "errors.groupsReached",
      "groups has been reached",
    )}`;
  }

  const exact: Record<string, [string, string]> = {
    "At least 2 groups are required to play": [
      "errors.needGroups",
      "At least 2 groups are required to play",
    ],
    "Room does not exist": ["errors.roomNotFound", "Room does not exist"],
    "Only the host can do this": [
      "errors.onlyHost",
      "Only the host can do this",
    ],
    "The match is already in progress": [
      "errors.matchStarted",
      "The match is already in progress",
    ],
    "Operators can only be changed at the start of the round": [
      "errors.operatorsStartOnly",
      "Operators can only be changed at the start of the round",
    ],
    "You do not have permission to set the operator": [
      "errors.cannotSetOperator",
      "You do not have permission to set the operator",
    ],
    "The in-person operator needs the group leader’s online device": [
      "errors.presentOperatorDevice",
      "The in-person operator needs the group leader’s online device",
    ],
    "Invalid or unavailable player": [
      "errors.invalidPlayer",
      "Invalid or unavailable player",
    ],
    "This action is unavailable during team recognition": [
      "errors.notTeamRecognition",
      "This action is unavailable during team recognition",
    ],
    "The starting group is defined by the previous round winner": [
      "errors.startingGroupAutomatic",
      "The starting group is defined by the previous round winner",
    ],
    "Invalid starting group": ["errors.invalidStartingGroup", "Invalid starting group"],
    "Every operator needs an available device": [
      "errors.operatorDevice",
      "Every operator needs an available device",
    ],
    "Every group needs an operator": [
      "errors.groupOperator",
      "Every group needs an operator",
    ],
    "Only the current operator can do this": [
      "errors.onlyCurrentOperator",
      "Only the current operator can do this",
    ],
    "This action is unavailable outside the action phase": [
      "errors.outsideAction",
      "This action is unavailable outside the action phase",
    ],
    "Wait for all operators to accept the word change": [
      "errors.waitOperators",
      "Wait for all operators to accept the word change",
    ],
    "The timer is already running": [
      "errors.timerRunning",
      "The timer is already running",
    ],
    "This action is only available in Infiltration": [
      "errors.onlyInfiltration",
      "This action is only available in Infiltration",
    ],
    "Start the timer first": ["errors.startTimerFirst", "Start the timer first"],
    "Action rejected": ["errors.actionRejected", "Action rejected"],
    "This action is only available in Interception": [
      "errors.onlyInterception",
      "This action is only available in Interception",
    ],
    "Word changes are only available while the timer is stopped": [
      "errors.wordChangeTimerStopped",
      "Word changes are only available while the timer is stopped",
    ],
    "Only operators can request a word change": [
      "errors.onlyOperatorsRequest",
      "Only operators can request a word change",
    ],
    "Your request is already waiting for the other operators": [
      "errors.requestPending",
      "Your request is already waiting for the other operators",
    ],
    "This request cannot be accepted": [
      "errors.requestCannotAccept",
      "This request cannot be accepted",
    ],
    "A word change cannot be requested right now": [
      "errors.wordChangeUnavailable",
      "A word change cannot be requested right now",
    ],
    "Approval is only available while the timer is stopped": [
      "errors.approvalTimerStopped",
      "Approval is only available while the timer is stopped",
    ],
    "Only operators can accept the word change": [
      "errors.onlyOperatorsAccept",
      "Only operators can accept the word change",
    ],
    "Rejection is only available while the timer is stopped": [
      "errors.rejectionTimerStopped",
      "Rejection is only available while the timer is stopped",
    ],
    "Only operators can reject the word change": [
      "errors.onlyOperatorsReject",
      "Only operators can reject the word change",
    ],
    "This action is only available in the round report": [
      "errors.onlyRoundReport",
      "This action is only available in the round report",
    ],
    "Adjustment rejected (limit reached?)": [
      "errors.adjustmentRejected",
      "Adjustment rejected (limit reached?)",
    ],
    "Room is full (maximum 20 players)": [
      "errors.roomFull",
      "Room is full (maximum 20 players)",
    ],
    "That name is already being used in the room": [
      "errors.nameInUse",
      "That name is already being used in the room",
    ],
    "You were removed from this room": [
      "errors.removedFromRoom",
      "You were removed from this room",
    ],
    "You are not in the room": ["errors.notInRoom", "You are not in the room"],
    "Only online players can create groups": [
      "errors.onlyOnlineCreateGroup",
      "Only online players can create groups",
    ],
    "You are already the leader of a group and cannot create another": [
      "errors.alreadyGroupLeader",
      "You are already the leader of a group and cannot create another",
    ],
    "The room is still in the lobby": [
      "errors.roomStillLobby",
      "The room is still in the lobby",
    ],
    "You are not waiting to enter the room": [
      "errors.notWaitingRoom",
      "You are not waiting to enter the room",
    ],
    "Group does not exist": ["errors.groupNotFound", "Group does not exist"],
    "You do not have permission to delete this group": [
      "errors.cannotDeleteGroup",
      "You do not have permission to delete this group",
    ],
    "You do not have permission to manage this group": [
      "errors.cannotManageGroup",
      "You do not have permission to manage this group",
    ],
    "Player does not exist": ["errors.playerNotFound", "Player does not exist"],
    "Player not found or permission denied": [
      "errors.playerRemovalFailed",
      "Player not found or permission denied",
    ],
    "You do not have permission to remove this player": [
      "errors.cannotRemovePlayer",
      "You do not have permission to remove this player",
    ],
    "The online player is not in this group": [
      "errors.playerNotInGroup",
      "The online player is not in this group",
    ],
  };

  const translated = exact[message];
  return translated ? t(translated[0], translated[1]) : message;
}
