import { v4 as uuidv4 } from "uuid";

export function startSockets(onUpdate) {
  const uuid = uuidv4();
  const ws = new WebSocket(`ws://localhost:8000/ws/${uuid}`);

  ws.onmessage = function (event) {
    console.log(event.data);
    onUpdate(JSON.parse(event.data));
  };

  return (msg) => {
    ws.send(JSON.stringify(msg));
  };
}
