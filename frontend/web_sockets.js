export function startSockets(uuid, onUpdate) {
  let domain = window.location.host.split(":")[0];
  let port = import.meta.env.DEV ? ":8000" : "";
  let basePath = import.meta.env.PROD ? "/api/ws" : "/ws";
  const ws = new WebSocket(`ws://${domain}${port}${basePath}/${uuid}`);

  ws.onmessage = function (event) {
    console.log(event.data);
    onUpdate(JSON.parse(event.data));
  };

  return (msg) => {
    ws.send(JSON.stringify(msg));
  };
}
