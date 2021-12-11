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

        if self.queue is None:
            player = Player(websocket, id, 22)
            self.queue = player
            print("queued player")
        else:
            new_player = Player(websocket, id, 0, self.queue)
            self.queue.other_player = new_player
            game = Game(self.queue, new_player)
            self.games[self.queue.id] = game
            self.games[new_player.id] = game
            self.queue = None
            await game.start_game()
            print("created game")

    def disconnect(self, websocket: WebSocket):
        # If player is queued, remove them from queue
        if self.queue is not None and self.queue.con == websocket:
            self.queue = None

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
        manager.disconnect(websocket)
