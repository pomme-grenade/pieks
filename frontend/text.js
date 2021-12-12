export function updateText(state, playerId) {
  let textContent = "";

  if (state.current_player === playerId) {
    textContent += `Your turn`;
  } else {
    textContent += `Other player's turn`;
  }

  if (state.last_action?.action == "attack") {
    textContent += ", you were attacked!";
  } else if (state.last_action?.action == "jumpAttack") {
    textContent += ", you were attacked indirectly!";
  }

  const distance = Math.abs(state.other_pos - state.own_pos);
  textContent += ` - distance: ${distance}`;

  return textContent;
}
