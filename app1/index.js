const express = require('express');
const kafka = require('kafka-node');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
app.use(express.json());

const dbsAreRunning = async () => {
  const db = new Sequelize(process.env.POSTGRES_URL);
  const User = db.define('user', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  });

  await db.sync({ force: true });

  const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS });
  const producer = new kafka.Producer(client);

  producer.on('ready', async () => {
    app.post('/', async (req, res) => {
      producer.send(
        [
          {
            topic: process.env.KAFKA_TOPIC,
            messages: JSON.stringify(req.body)
          }
        ],
        async (err, data) => {
          if (err) {
            console.error(err);
            res.status(500).send('Kafka error');
          } else {
            await User.create(req.body);
            res.send(req.body);
          }
        }
      );
    });
  });

  producer.on('error', err => {
    console.error('Producer error:', err);
  });
};

setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT, () => console.log(`App1 running on port ${process.env.PORT}`));
