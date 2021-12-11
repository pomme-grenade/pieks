import { v4 as uuidv4 } from "uuid";

export function startSockets() {
  const uuid = uuidv4();
  const ws = new WebSocket(`ws://localhost:8000/ws/${uuid}`);

  ws.onmessage = function (event) {
    console.log(event.data);
  };

  //function sendMessage(msg) {
  //ws.send(msg);
  //}

  //sendMessage("asd");

  ws.onopen = () => {
    ws.send("hello");
  };
}
