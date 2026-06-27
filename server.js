const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', (ws) => {
  console.log('🔌 OBS/Avatar conectado al canal 3002');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'UPDATE_THRESHOLD') {
        wss.clients.forEach((client) => {
          if (client.readyState === 1 /* OPEN */) {
            client.send(JSON.stringify({ type: 'NEW_THRESHOLD', value: data.value }));
          }
        });
      }
    } catch (e) {
      console.error('Error en WS:', e);
    }
  });
});

console.log('📡 Servidor de puente para OBS listo en el puerto 3002');