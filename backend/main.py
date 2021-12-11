from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from uuid import UUID

import random

app = FastAPI()

class Player:
    def __init__(self, con: WebSocket, id: UUID, pos: int):
        self.con = con
        self.id = id
        self.hand = []
        self.pos = pos
    
    def get_state(self):
        return {
            "hand": self.hand,
        }
    
class Game:
    def __init__(self, p1: Player, p2: Player):
        self.p1 = p1
        self.p2 = p2
        self.deck = []
        self.init_deck()
        self.draw_cards(p1)
        self.draw_cards(p2)

    async def start_game(self):
        await self.p1.con.send_text("los")
        await self.p2.con.send_text("los")
        await self.p1.con.send_json(self.p1.get_state())
        await self.p2.con.send_json(self.p2.get_state())

    def init_deck(self):
        for i in range(5):
            for j in range(1, 6):
                self.deck.append(j)
        random.shuffle(self.deck)

    def draw_cards(self, player, parry = False):
        if parry:
            return
        else:
            for i in range(5 - len(player.hand)):
                player.hand.append(self.deck[len(self.deck) - 1])
                self.deck.pop()

    def get_global_state(self):
       return {
           "pos_1": self.p1.pos,
           "pos_2": self.p2.pos,
       }

class ConnectionManager:
    def __init__(self):
        self.queue: Optional[Player] = None
        self.games: List[Game] = []

    async def connect(self, websocket: WebSocket, id: UUID):
        await websocket.accept()
        player = None

        if self.queue == None:
            self.queue = player
            player = Player(websocket, id, 22)
        else:
            player = Player(websocket, id, 0)
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
