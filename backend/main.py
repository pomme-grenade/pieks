from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse
from uuid import UUID

import random

app = FastAPI()

class Player:
    def __init__(self, con: WebSocket, id: UUID, pos: int, other = None):
        self.con = con
        self.id = id
        self.hand = []
        self.pos = pos
        self.other_player = other
    
class Game:
    def __init__(self, p1: Player, p2: Player):
        self.p1 = p1
        self.p2 = p2
        self.deck = []
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

    def draw_cards(self, player, parry = False):
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

    async def update_state(self, data, id):
        player = self.get_player_by_id(id)
        if data["action"] == "moveRight":
            player.pos += data["cards"][0]
        elif data["action"] == "moveLeft":
            player.pos -= data["cards"][0]

        self.current_player = player.other_player
        self.last_action = data["action"]

        await self.p1.con.send_json(self.get_state(self.p1))
        await self.p2.con.send_json(self.get_state(self.p2))

    def get_player_by_id(self, id):
       if id == self.p1.id:
           return self.p1
       else:
           return self.p2

class ConnectionManager:
    def __init__(self):
        self.queue: Optional[Player] = None
        self.games = {}

    async def connect(self, websocket: WebSocket, id: UUID):
        await websocket.accept()

        if self.queue == None:
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
            # await manager.send_personal_message(f"You wrote: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
