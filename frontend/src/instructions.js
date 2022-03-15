export function getInstructions(state, playerId) {
  if (playerId !== state["current_player"]) {
    return "";
  }

  let actions = state["next_moves"]
    .map((move) => [move["action"], move["cards"]])
    .map(([action, cards]) => {
      if (action === "moveLeft" || action === "moveRight") {
        return ["move", cards];
      }
      return [action, cards];
    });
  actions = Object.fromEntries(actions);

  let result = "";

  actions = Object.entries(actions).map(([action, cards]) => {
    let range;
    switch (action) {
      case "parry":
        range = describeMandatoryCardRange(cards);
        return `Parry the enemy's attack by selecting ${range}.`;
      case "skip":
        return "End your turn by clicking on the playing field.";
      case "move":
        // todo change this for evading quick attacks
        return "Select a card and click the playing field to move your player.";
      case "attack":
        range = describeOptionalCardRange(cards);
        return `Select ${range} to attack your enemy directly.`;
      case "jumpAttack":
        range = describeOptionalCardRange(cards);
        return `Select ${range} to lunge at your opponent.`;
    }
  });

  if (actions.length > 1) {
    result += "Choose a move:\n\n";
    actions = actions.map((text) => `- ${text}`);
  }

  result += actions.join("\n");

  return result;
}

function wordForNumber(number) {
  return {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
  }[number];
}

function describeMandatoryCardRange(cards) {
  if (cards.length == 1) {
    return `a ${cards[0]} card`;
  } else {
    return `${wordForNumber(cards.length)} ${cards[0]} cards`;
  }
}

function describeOptionalCardRange(cards) {
  if (cards.length == 1) {
    return `a ${cards[0]} card`;
  } else {
    return `up to ${wordForNumber(cards.length)} ${cards[0]} cards`;
  }
}
