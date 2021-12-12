from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from uuid import UUID
from typing import List
from collections import defaultdict
import random


class Player:
    def __init__(self, con: WebSocket, id: UUID, pos: int, other=None):
        self.con = con
        self.id = id
        self.hand: List[int] = []
        self.pos = pos
        self.other_player = other

    def remove_cards(self, cards: List[int]):
        for card in cards:
            self.hand.remove(card)


class Game:
    def __init__(self, p1: Player, p2: Player):
        self.p1 = p1
        self.p2 = p2
        self.deck: List[int] = []
        self.init_deck()
        self.draw_cards(p1)
        self.draw_cards(p2)
        self.current_player = p1
        self.last_action = None

    async def start_game(self):
        # await self.p1.con.send_text("los")
        # await self.p2.con.send_text("los")
        await self.p1.con.send_json(self.get_state(self.p1))
        await self.p2.con.send_json(self.get_state(self.p2))

    def init_deck(self):
        for i in range(5):
            for j in range(1, 6):
                self.deck.append(j)
        random.shuffle(self.deck)

    def draw_cards(self, player, parry=False):
        if parry:
            return
        else:
            # TODO handle empty cards
            for i in range(5 - len(player.hand)):
                player.hand.append(self.deck[len(self.deck) - 1])
                self.deck.pop()

    def get_state(self, own_player):
        return {
            "own_pos": own_player.pos,
            "other_pos": own_player.other_player.pos,
            "current_player": jsonable_encoder(self.current_player.id),
            "last_action": self.last_action,
            "own_hand": own_player.hand,
            "next_moves": self.get_legal_moves(own_player),
        }

    def get_legal_moves(self, player):
        moves = []

        if self.current_player != player:
            return moves

        # parry
        was_attacked = self.last_action is not None and self.last_action["action"] in [
            "attack",
            "jumpAttack",
        ]
        if was_attacked:
            card_amount = 0
            for card in player.hand:
                if card == self.last_action.cards[0]:
                    card_amount += 1
            if card_amount == len(self.last_action.cards):
                moves.append({"action": "parry", "cards": self.last_action.cards})
                # if there was a direct attack, no other moves are possible
            if self.last_action["action"] == "attack":
                return moves

        # move
        is_left_player = player.pos < player.other_player.pos
        is_right_player = not is_left_player
        can_not_move_left = self.last_action is not None and (
            is_right_player and self.last_action["action"] == "jumpAttack"
        )
        can_not_move_right = self.last_action is not None and (
            is_left_player and self.last_action["action"] == "jumpAttack"
        )

        for card in player.hand:
            new_pos = player.pos - card
            will_stay_left_player = new_pos < player.other_player.pos
            if (
                new_pos >= 0
                and is_left_player == will_stay_left_player
                and new_pos != player.other_player.pos
                and not can_not_move_left
            ):
                moves.append({"action": "moveLeft", "cards": [card]})
            new_pos = player.pos + card
            will_stay_left_player = new_pos < player.other_player.pos
            if (
                new_pos <= 22
                and is_left_player == will_stay_left_player
                and new_pos != player.other_player.pos
                and not can_not_move_right
            ):
                moves.append({"action": "moveRight", "cards": [card]})

        # attack
        card_types = defaultdict(list)
        for card in player.hand:
            card_types[card].append(card)

        for card_type, multiple in card_types.items():
            if player.pos + card_type == player.other_player.pos:
                moves.append({"action": "attack", "cards": multiple})

        return moves

    async def update_state(self, move, id):
        player = self.get_player_by_id(id)
        if player != self.current_player:
            print(f"Player {id} not current player, aborting")
            return
        if move not in self.get_legal_moves(player):
            print(f"invalid move, aborting: {move}")
            return

        if move["action"] == "moveRight":
            player.pos += move["cards"][0]
            player.remove_cards(move["cards"])
        elif move["action"] == "moveLeft":
            player.pos -= move["cards"][0]
            player.remove_cards(move["cards"])
        elif move["action"] == "parry":
            player.remove_cards(move["cards"])

        self.draw_cards(player, move["action"] == "parry")

        self.current_player = player.other_player
        self.last_action = move

        await self.p1.con.send_json(self.get_state(self.p1))
        await self.p2.con.send_json(self.get_state(self.p2))

    def get_player_by_id(self, id):
        if id == self.p1.id:
            return self.p1
        else:
            return self.p2
