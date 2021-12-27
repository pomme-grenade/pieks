from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from uuid import UUID
from typing import Optional, Dict

from game import Player, Game


app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.queue: Optional[Player] = None
        self.games: Dict[UUID, Game] = {}

    async def connect(self, websocket: WebSocket, id: UUID):
        await websocket.accept()

        existing_game = self.games.get(id)
        if existing_game is not None:
            print("reconnecting player")
            player = existing_game.get_player_by_id(id)
            if player.con is not None:
                print("player already connected, doing nothing")
                return
            player.con = websocket
            await websocket.send_json({"event": "game_start"})
            await existing_game.send_state_to_players()
        elif self.queue is None:
            print("queuing player")
            player = Player(websocket, id, 22)
            self.queue = player
        else:
            print("creating new game")
            if self.queue.id == id:
                print("Not creating game with the same two ids, doing nothing")
                return

            new_player = Player(websocket, id, 0, self.queue)
            self.queue.other_player = new_player
            game = Game(self.queue, new_player)
            self.games[self.queue.id] = game
            self.games[new_player.id] = game
            self.queue = None
            await game.start_game()

    async def disconnect(self, websocket: WebSocket, id: UUID):
        # If player is queued, remove them from queue
        if self.queue is not None and self.queue.con == websocket:
            self.queue = None
        else:
            # send disconnect message to other player
            game = self.games.get(id)
            if game is None:
                return
            player = game.get_player_by_id(id)
            player.con = None
            if player.other_player.con is None:
                self.remove_game(id)
            else:
                await player.other_player.con.send_json(
                    {"event": "other_player_disconnected"}
                )

    def remove_game(self, id: UUID):
        # remove the game by the given ID
        game: Game = self.games.pop(id)
        # also remove the game for the other player's ID
        self.games.pop(game.get_player_by_id(id).other_player.id)


manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: UUID):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            game = manager.games.get(client_id)
            if game is not None:
                await game.update_state(data, client_id)
                if game.is_over:
                    manager.remove_game(client_id)
            # todo search for new game here
    except WebSocketDisconnect:
        await manager.disconnect(websocket, client_id)
