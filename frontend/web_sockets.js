export function startSockets(uuid, onUpdate) {
  let ws = createSocket(uuid, onUpdate);

  let retryConnection = () => {
    setTimeout(() => {
      ws = createSocket(uuid, onUpdate);
      ws.onclose = retryConnection;
    }, 2000);
  };

  ws.onclose = retryConnection;

  return (msg) => {
    ws.send(JSON.stringify(msg));
  };
}

function createSocket(uuid, onUpdate) {
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

  ws.onclose = (event) => {
    onUpdate({ event: "connection_lost" });
  };

  ws.onerror = (event) => {
    ws.close();
  };

  return ws;
}
