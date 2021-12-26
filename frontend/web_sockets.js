export function startSockets(uuid, onUpdate) {
  let domain = window.location.host.split(":")[0];
  let url = `ws://${domain}:8000/ws/${uuid}`;
  if (import.meta.env.PROD) {
    url = `wss://${domain}/api/ws/${uuid}`;
  }
  const ws = new WebSocket(url);

  ws.onmessage = function (event) {
    console.log(event.data);
    onUpdate(JSON.parse(event.data));
  };

  return (msg) => {
    ws.send(JSON.stringify(msg));
  };
}
