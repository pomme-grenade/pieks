import { v4 } from "uuid";

export function getPlayerId() {
  // Allow modifying storage keys in development for different players in different tabs
  const storageKey = `playerId${location.hash}`;
  let id = window.localStorage.getItem(storageKey);
  if (id == null) {
    id = v4();
    window.localStorage.setItem(storageKey, id);
  }
  return id;
}
