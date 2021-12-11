from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from uuid import UUID

app = FastAPI()

class Player:
    def __init__(self, con: WebSocket, id: UUID):
        self.con = con
        self.id = id

class Game:
    def __init__(self, p1: Player, p2: Player):
        self.p1 = p1
        self.p2 = p2

    async def start_game(self):
        await self.p1.con.send_text("los")
        await self.p2.con.send_text("los")

# class GameState:
    # def __init__(self):


class ConnectionManager:
    def __init__(self):
        self.queue: Optional[Player] = None
        self.games: List[Game] = []

    async def connect(self, websocket: WebSocket, id: UUID):
        await websocket.accept()
        player = Player(websocket, id)

        if self.queue == None:
            self.queue = player
        else:
            game = Game(self.queue, player)
            self.games.append(game)
            await game.start_game()

    def disconnect(self, websocket: WebSocket):
        self.queue.remove(websocket)

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
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
