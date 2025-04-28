require("dotenv").config();
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const LOCK_ID_2 = process.env.LOCK_ID_2;
const LOCK_IDS = [LOCK_ID_2];
const NUKI_API_BASE = "https://api.nuki.io";

function generateDeterministicPin(seed, dateStr) {
  const hash = crypto.createHash('sha256').update(seed + dateStr).digest("hex");

  let pin = "";
  for (let i = 0; i < 6; i++) {
    const digit = (parseInt(hash[i], 16) % 9) + 1; // 1-9 only
    pin += digit.toString();
  }
  return pin;
}
// function generateDeterministicPin(seed, dateStr) {
//   const hash = crypto.createHash('sha256').update(seed + dateStr).digest("hex");
//   const pin = parseInt(hash.slice(0, 6), 16) % 900000 + 100000;
//   return pin.toString();
// }

async function sendPinToLocks({ email, room, startTime, endTime }) {
  try {
    console.log("🚀 Starting sendPinToLocks()");
    console.log("📧 Email:", email);
    console.log("🏠 Room:", room);
    console.log("⏰ Start:", startTime);
    console.log("⏰ End:", endTime);

    const bookingDate = new Date(startTime);
    const dateStr = bookingDate.toISOString().split("T")[0];
    const validFrom = new Date(new Date(startTime).getTime() - 15 * 60 * 1000);
    const validUntil = new Date(endTime);

    const headers = {
      Authorization: `Bearer ${process.env.NUKI_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const pinMap = {};

    for (const lockId of LOCK_IDS) {
      console.log(`🔍 Processing lock ${lockId}`);

      const lockPin = generateDeterministicPin(email + lockId, dateStr);
      pinMap[lockId] = lockPin;
      const shortName = email.split("@")[0].slice(0, 20); // truncate to 20 max


      const payload = {
        // smartlockId: Number(lockId),
        smartlockIds: [Number(lockId)], // ✅ must be an array
        // name: `PIN for ${email}`,
        // name: shortName,
        name: `hongpei17`, 
        code: parseInt(lockPin),
        type: 13,
        allowedFromDate: validFrom.toISOString(),
        allowedUntilDate: validUntil.toISOString(),
      };

      console.log("📦 Web API PIN payload:", JSON.stringify(payload, null, 2));

      try {
        await axios.post(`${NUKI_API_BASE}/smartlock/auth`, payload, { headers });
        console.log(`✅ PIN ${lockPin} created via Nuki Web API on lock ${lockId}`);
      } catch (apiErr) {
        console.error("❌ Error while creating PIN on Nuki Web API:", apiErr.response?.data || apiErr.message);
      }
    }

    const pinText = `🔑 Access PIN:\n• Room: ${room} → ${pinMap[LOCK_ID_2]}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const emailText = `
✉️ Your Practice Room Access Details

Hi there,
Thank you for booking with us!

Please find your access details below:

${pinText}

📅 Reservation: ${new Date(startTime).toLocaleString()} – ${new Date(endTime).toLocaleString()}
📍 Address: Brunnenstraße 196, 10119 Berlin

🕒 When can I enter?
Your PIN will be active shortly before your session and will stop working after it ends.

🚪 How do I get in?
Enter the PIN on the Nuki keypad next to the door — it will unlock automatically.

✔️ Before you leave:
• Please make sure the door is properly closed.
• If you run into any issues, feel free to reach out.

Wishing you a great practice session!  
Best regards,  
ümm
`;

    await transporter.sendMail({
      from: `"ümm Practice Room" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Practice Room PIN & Access Info",
      text: emailText,
    });

    console.log("📩 Email sent to", email);
    return { success: true, pin: pinMap };
  } catch (err) {
    console.error("❌ Error in sendPinToLocks:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendPinToLocks };
