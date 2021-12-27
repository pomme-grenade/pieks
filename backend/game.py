from fastapi.encoders import jsonable_encoder
from uuid import UUID
from typing import List, Optional
from player import Player
import random


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
        self.last_player: Optional[Player] = None

    async def send_each(self, json):
        await self.p1.con.send_json(json)
        await self.p2.con.send_json(json)

    async def start_game(self):
        await self.send_each({"event": "game_start"})
        await self.send_state_to_players()

    def init_deck(self):
        for i in range(5):
            for j in range(1, 6):
                self.deck.append(j)
        random.shuffle(self.deck)

    def draw_cards(self, player):
        for i in range(5 - len(player.hand)):
            if len(self.deck) == 0:
                return
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

        is_left_player = player.pos < player.other_player.pos
        is_right_player = not is_left_player

        # parry
        was_attacked = self.last_action is not None and self.last_action["action"] in [
            "attack",
            "jumpAttack",
        ]
        if was_attacked:
            card_amount = 0
            for card in player.hand:
                if card == self.last_action["cards"][0]:
                    card_amount += 1
            if card_amount >= len(self.last_action["cards"]):
                moves.append({"action": "parry", "cards": self.last_action["cards"]})
                # if there was a direct attack, no other moves are possible
            if self.last_action["action"] == "attack":
                return moves

        # attack
        if not was_attacked:
            attack_direction = 1 if is_left_player else -1

            last_action_name = self.last_action and self.last_action.get("action")

            # jump attack
            if self.last_player == player and last_action_name in [
                "moveRight",
                "moveLeft",
            ]:
                was_forward_move = (
                    is_left_player and last_action_name == "moveRight"
                ) or (not is_left_player and last_action_name == "moveLeft")
                can_jump_attack = self.last_player == player and was_forward_move

                if can_jump_attack:
                    moves += player.get_attack_moves("jumpAttack", attack_direction)

                # no other moves possible after moving
                moves.append({"action": "skip", "cards": []})

                return moves

            # standard attack
            moves += player.get_attack_moves("attack", attack_direction)

        # move
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

        return moves

    async def update_state(self, move, id: UUID):
        player = self.get_player_by_id(id)
        if player != self.current_player:
            print(f"Player {id} not current player, aborting")
            return
        legal_moves = self.get_legal_moves(player)
        if move not in legal_moves:
            print(f"invalid move, aborting: {move}")
            return

        if move["action"] == "moveRight":
            player.pos += move["cards"][0]
        elif move["action"] == "moveLeft":
            player.pos -= move["cards"][0]

        player.remove_cards(move["cards"])

        retreated_after_jump_attack = (
            move["action"] in ["moveLeft", "moveRight"]
            and self.last_action is not None
            and self.last_action["action"] == "jumpAttack"
        )

        self.last_action = move
        self.last_player = player

        # re-calculate legal moves for the new state
        legal_moves = self.get_legal_moves(player)
        own_next_moves = [x["action"] for x in legal_moves]

        can_play_again = (
            move["action"] in ["parry", "moveLeft", "moveRight"]
            and not retreated_after_jump_attack
            and not ("skip" in own_next_moves and len(own_next_moves) == 1)
        )

        if not can_play_again:
            self.draw_cards(player)
            self.current_player = player.other_player

        await self.send_state_to_players()

        other_player_moves = self.get_state(player.other_player)["next_moves"]
        if len(self.deck) == 0 and "parry" not in other_player_moves:
            winner = self.get_winner()
            await self.send_game_over(winner)
        # only check for game end if the current player changes
        elif len(other_player_moves) == 0 and not self.current_player == player:
            await self.send_game_over(player)

    async def send_game_over(self, winner):
        self.send_each({"event": "game_over", "winner": jsonable_encoder(winner.id)})

    def get_winner(self):
        player = self.current_player
        other_player = player.other_player
        is_left_player = player.pos < other_player.pos

        winner = self.current_player
        center = 11

        if is_left_player:
            distLeft = center - player.pos
            distRight = other_player.pos - 11
            winner = player if distLeft < distRight else other_player
        else:
            distLeft = center - other_player.pos
            distRight = player.pos - 11
            winner = other_player if distLeft < distRight else player

        winner = None if distLeft == distRight else winner
        return winner

    async def send_state_to_players(self):
        if self.p1.con is not None:
            await self.p1.con.send_json(self.get_state(self.p1))
        if self.p2.con is not None:
            await self.p2.con.send_json(self.get_state(self.p2))

    def get_player_by_id(self, id) -> Player:
        if id == self.p1.id:
            return self.p1
        else:
            return self.p2
