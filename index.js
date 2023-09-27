const express = require('express');
const app = express();
const amqp = require('amqplib/callback_api');
const cors = require('cors');

const AMQP_URL = 'amqp://localhost';
const QUEUE_NAME = 'chat';
const PORT = 9876;

const receivedMessages = [];

app.use(cors());

function consumeQueue() {
  amqp.connect(AMQP_URL, function (error0, connection) {
    if (error0) {
      throw error0;
    }

    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }

      channel.assertQueue(QUEUE_NAME, {
        durable: true,
      });

      console.log('Aguardando mensagens da fila...');

      channel.consume(
        QUEUE_NAME,
        function (msg) {
          if (!msg) {
            return;
          }

          try {
            const message = JSON.parse(msg.content.toString());
            receivedMessages.push(message);

            console.log('Mensagem recebida: ', msg.content.toString());
            console.log('Array de mensagens: ', receivedMessages);

            // avisa que recebeu a mensagem e remove da fila
            channel.ack(msg);
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
          }
        },
        {
          noAck: false,
        }
      );
    });
  });
}

// Call consumeQueue before starting the HTTP server
consumeQueue();

app.get('/mensagens', (req, res) => {
  res.json(receivedMessages);
});

app.listen(PORT, () => {
  console.log('Servidor está ouvindo na porta', PORT);
});
