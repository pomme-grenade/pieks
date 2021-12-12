export function startSockets(uuid, onUpdate) {
  let domain = window.location.host.split(":")[0];
  const ws = new WebSocket(`ws://${domain}:8000/ws/${uuid}`);

  ws.onmessage = function (event) {
    console.log(event.data);
    onUpdate(JSON.parse(event.data));
  };

  return (msg) => {
    ws.send(JSON.stringify(msg));
  };
}
