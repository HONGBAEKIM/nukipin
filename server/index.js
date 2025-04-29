require('dotenv').config();
const express = require('express');
const axios = require('axios'); // ✅ You need this for list-pins
const { sendPinToLocks } = require('./sendPinToLocks');

const app = express();
const PORT = 3000;

app.use(express.json());




// for one booking
app.post('/create-pin', async (req, res) => {
  const secretHeader = req.headers['x-api-secret'];

  if (secretHeader !== process.env.secret) {
    return res.status(403).json({ error: 'Unauthorized: Invalid API secret' });
  }

  const { email, room, startTime, endTime } = req.body;

  if (!email || !room || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await sendPinToLocks({ email, room, startTime, endTime });

  if (result.success) {
    res.status(200).json({ message: 'PIN created and email sent', pin: result.pin });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/list-pins', async (req, res) => {
  const secretHeader = req.headers['x-api-secret'];

  if (secretHeader !== process.env.secret) {
    return res.status(403).json({ error: 'Unauthorized: Invalid API secret' });
  }

  try {
    const headers = {
      Authorization: `Bearer ${process.env.NUKI_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const now = new Date();
    const allPins = [];

    const LOCK_ID_1 = process.env.LOCK_ID_1;
    const LOCK_ID_2 = process.env.LOCK_ID_2;
    const lockIds = [LOCK_ID_1, LOCK_ID_2];

    for (const lockId of lockIds) {
      const response = await axios.get(`https://api.nuki.io/smartlock/${lockId}/auth`, { headers });

      const pins = response.data.map((auth) => {
        const until = auth.allowedUntilDate ? new Date(auth.allowedUntilDate) : null;
        return {
          lockId: lockId,
          code: auth.code,
          name: auth.name,
          from: auth.allowedFromDate,
          until: auth.allowedUntilDate,
          expired: until ? until < now : false,
        };
      });

      allPins.push(...pins);
    }

    res.status(200).json(allPins);
  } catch (err) {
    console.error("❌ Error listing PINs:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch PINs" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

