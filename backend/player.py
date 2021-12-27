from typing import List, Optional
from collections import defaultdict
from fastapi import WebSocket
from uuid import UUID


class Player:
    def __init__(self, con: WebSocket, id: UUID, pos: int, other=None):
        self.con: Optional[WebSocket] = con
        self.id = id
        self.hand: List[int] = []
        self.pos = pos
        self.other_player: Player = other

    def remove_cards(self, cards: List[int]):
        for card in cards:
            self.hand.remove(card)

    def get_attack_moves(self, attack_type: str, attack_direction: int) -> List:
        card_types = defaultdict(list)
        moves = []
        for card in self.hand:
            card_types[card].append(card)
        for card_type, multiple in card_types.items():
            if self.pos + card_type * attack_direction == self.other_player.pos:
                for i in range(1, len(multiple) + 1):
                    moves.append({"action": attack_type, "cards": multiple[:i]})
        return moves
