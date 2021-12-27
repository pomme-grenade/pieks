from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from uuid import UUID
from typing import Optional

from game import Player, Game


app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.queue: Optional[Player] = None
        self.games = {}

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
            game = self.games[id]
            game.get_player_by_id(id).con = None
            other_player = game.p1 if game.p1.id != id else game.p2
            if other_player.con is None:
                # todo both players left, remove the game
                pass
            else:
                await other_player.con.send_json({"event": "other_player_disconnected"})

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    # async def broadcast(self, message: str):
    # for connection in self.queue:
    # await connection.send_text(message)


manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: UUID):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.games[client_id].update_state(data, client_id)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, client_id)
