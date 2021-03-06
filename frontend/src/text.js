export function updateText(state, playerId) {
  let textContent = "";

  let [leftScore, rightScore] = state.scores;
  if (leftScore !== 0 || rightScore !== 0) {
    textContent += `Round scores: ${leftScore} - ${rightScore} | `;
  }

  if (state.current_player === playerId) {
    textContent += `Your turn`;
  } else {
    textContent += `Other player's turn`;
  }

  if (
    state.last_action?.action == "attack" &&
    state.current_player == playerId
  ) {
    textContent += `, you were attacked with the following cards: ${state.last_action.cards.join(
      ", "
    )}`;
  } else if (
    state.last_action?.action == "jumpAttack" &&
    state.current_player == playerId
  ) {
    textContent += `, your enemy lunged at you with the following cards: ${state.last_action.cards.join(
      ", "
    )}`;
  }

  return textContent;
}
