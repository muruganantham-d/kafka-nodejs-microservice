const express = require('express');
const kafka = require('kafka-node');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

const dbsAreRunning = async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const User = mongoose.model('user', {
    name: String,
    email: String,
    password: String
  });

  const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS });
  const consumer = new kafka.Consumer(
    client,
    [{ topic: process.env.KAFKA_TOPIC }],
    { autoCommit: false }
  );

  consumer.on('message', async (message) => {
    try {
      const user = new User(JSON.parse(message.value));
      await user.save();
      console.log('User saved:', user);
    } catch (err) {
      console.error('Error saving user:', err);
    }
  });

  consumer.on('error', (err) => {
    console.error('Consumer error:', err);
  });
};

setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT, () => console.log(`App2 running on port ${process.env.PORT}`));
