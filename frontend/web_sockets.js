export function startSockets(uuid, onUpdate) {
  const ws = new WebSocket(`ws://localhost:8000/ws/${uuid}`);

  ws.onmessage = function (event) {
    console.log(event.data);
    onUpdate(JSON.parse(event.data));
  };

  return (msg) => {
    ws.send(JSON.stringify(msg));
  };
}
