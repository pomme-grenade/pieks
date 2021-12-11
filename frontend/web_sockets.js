export function startSockets() {
  var ws = new WebSocket("ws://localhost:8000/ws/4");

  ws.onmessage = function (event) {
    console.log(event.data);
  };

  //function sendMessage(msg) {
  //ws.send(msg);
  //}

  //sendMessage("asd");

  ws.onopen = () => {
    ws.send("asdfkadsflk;jdsafjsad;lfjdsafkajds;lfjdsafkjdsalfkjsa");
  };
}
