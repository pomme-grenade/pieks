from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from uuid import UUID
from typing import List
import random


class Player:
    def __init__(self, con: WebSocket, id: UUID, pos: int, other=None):
        self.con = con
        self.id = id
        self.hand: List[int] = []
        self.pos = pos
        self.other_player = other


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
            "other_hand": own_player.other_player.hand,
        }

    def is_valid_move(self, player, move):
        if self.current_player != player:
            return False

        if move["action"] == "moveRight":
            new_pos = player.pos + move["cards"][0]
            if new_pos > 22 or new_pos > player.other_player.pos:
                return False

        elif move["action"] == "moveLeft":
            new_pos = player.pos - move["cards"][0]
            if new_pos < 0 or new_pos < player.other_player.pos:
                return False

        elif move["action"] == "attack":
            # check that all cards have equal values
            first_card = move["cards"][0]
            for other_card in move["cards"]:
                if other_card != first_card:
                    return False

            # check that positions match the card value
            attack_position = player.pos + first_card
            if attack_position != player.other_player.pos:
                return False

        return True

    async def update_state(self, move, id):
        player = self.get_player_by_id(id)
        if not self.is_valid_move(player, move):
            print(f"invalid move, aborting: {move}")
            return

        if move["action"] == "moveRight":
            player.pos += move["cards"][0]
        elif move["action"] == "moveLeft":
            player.pos -= move["cards"][0]

        self.current_player = player.other_player
        self.last_action = move["action"]

        await self.p1.con.send_json(self.get_state(self.p1))
        await self.p2.con.send_json(self.get_state(self.p2))

    def get_player_by_id(self, id):
        if id == self.p1.id:
            return self.p1
        else:
            return self.p2
