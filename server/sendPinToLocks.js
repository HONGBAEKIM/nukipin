require("dotenv").config();
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const LOCK_ID_1 = process.env.LOCK_ID_1;
const LOCK_ID_2 = process.env.LOCK_ID_2;
const LOCK_IDS = [LOCK_ID_1, LOCK_ID_2];
const NUKI_API_BASE = "https://api.nuki.io";

// Generate a 6-digit PIN with only digits 1–9
function generateDeterministicPin(seed, dateStr) {
  const hash = crypto.createHash('sha256').update(seed + dateStr).digest("hex");
  let pin = "";
  for (let i = 0; i < 6; i++) {
    const digit = (parseInt(hash[i], 16) % 9) + 1;
    pin += digit.toString();
  }
  return pin;
}

// Delete expired PINs from a lock
async function deleteExpiredPins(lockId, headers) {
  console.log(`🧹 Checking expired PINs for lock ${lockId}`);
  try {
    const res = await axios.get(`${NUKI_API_BASE}/smartlock/${lockId}/auth`, { headers });
    const now = new Date();

    for (const auth of res.data) {
      if (auth.allowedUntilDate) {
        const until = new Date(auth.allowedUntilDate);
        if (until < now) {
          console.log(`🗑️ Deleting expired PIN: ${auth.name || auth.code}`);
          await axios.delete(`${NUKI_API_BASE}/smartlock/${lockId}/auth/${auth.id}`, { headers });
        }
      }
    }
  } catch (err) {
    console.error("❌ Error cleaning expired PINs:", err.response?.data || err.message);
  }
}

async function sendPinToLocks({ email, room, startTime, endTime }) {
  try {
    console.log("🚀 Starting sendPinToLocks()");
    console.log("📧 Email:", email);
    console.log("🏠 Room:", room);
    console.log("⏰ Start:", startTime);
    console.log("⏰ End:", endTime);

    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);
    const fifteenMinutesEarlier = new Date(bookingStart.getTime() - 15 * 60 * 1000);
    // const dateOnlyStr = bookingStart.toISOString().split('T')[0];

    const berlinTZ = "Europe/Berlin";

    function getBerlinDateStr(date) {
      const berlinDate = new Date(date.toLocaleString("en-US", { timeZone: berlinTZ }));
      return berlinDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
    }

    function getBerlinMinutes(date) {
      const local = new Date(date.toLocaleString("en-US", { timeZone: berlinTZ }));
      return local.getHours() * 60 + local.getMinutes();
    }

    const berlinDateStr = getBerlinDateStr(bookingStart);
    const allowedFromDate = `${berlinDateStr}T00:01:00.000Z`;
    const allowedUntilDate = `${berlinDateStr}T23:59:00.000Z`;

    const allowedFromMinutes = getBerlinMinutes(fifteenMinutesEarlier);
    const allowedUntilMinutes = getBerlinMinutes(bookingEnd);

    const headers = {
      Authorization: `Bearer ${process.env.NUKI_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const lockPin = generateDeterministicPin(email, berlinDateStr);
    const pinMap = {};

    for (const lockId of LOCK_IDS) {
      console.log(`🔍 Processing lock ${lockId}`);

      // Delete old expired PINs
      await deleteExpiredPins(lockId, headers);

      // Check if PIN already exists
      const existingAuthsRes = await axios.get(`${NUKI_API_BASE}/smartlock/${lockId}/auth`, { headers });
      const existingAuth = existingAuthsRes.data.find((auth) => auth.code == lockPin);

      const shortName = email.split("@")[0].slice(0, 20);

      let finalAllowedFromTime = allowedFromMinutes;
      let finalAllowedUntilTime = allowedUntilMinutes;

      if (existingAuth) {
        console.log(`🔄 PIN already exists. Checking time extension...`);
        const existingFromTime = existingAuth.allowedFromTime || 0;
        const existingUntilTime = existingAuth.allowedUntilTime || 1440;
        finalAllowedFromTime = Math.min(existingFromTime, allowedFromMinutes);
        finalAllowedUntilTime = Math.max(existingUntilTime, allowedUntilMinutes);
      }

      const payload = {
        smartlockIds: [Number(lockId)],
        name: shortName,
        code: parseInt(lockPin),
        type: 13,
        allowedFromDate,
        allowedUntilDate,
        allowedFromTime: finalAllowedFromTime,
        allowedUntilTime: finalAllowedUntilTime,
        allowedWeekDays: 127,
      };

      if (existingAuth) {
        console.log(`✏️ Updating existing PIN on lock ${lockId}`);
        await axios.post(`${NUKI_API_BASE}/smartlock/${lockId}/auth/${existingAuth.id}`, payload, { headers });
        console.log(`✅ PIN updated`);
      } else {
        console.log(`➕ Creating new PIN on lock ${lockId}`);
        await axios.put(`${NUKI_API_BASE}/smartlock/${lockId}/auth`, payload, { headers });
        console.log(`✅ PIN created`);
      }

      pinMap[lockId] = lockPin;
    }

    const berlinOptions = {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    
    const formattedStart = bookingStart.toLocaleString("en-GB", berlinOptions);
    const formattedEnd = bookingEnd.toLocaleString("en-GB", berlinOptions);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const emailText = `
✉️ 연습실 출입 정보 안내

안녕하세요,
저희 연습실을 예약해주셔서 감사합니다!

아래에 출입에 필요한 정보를 안내드립니다:

🔑 출입 PIN 번호: ${lockPin}
📅 예약 일정: ${formattedStart} – ${formattedEnd}
📍 주소: Brunnenstraße 196, 10119 Berlin

🕒 언제 입장할 수 있나요?
예약하신 시간 15분 전부터 PIN이 활성화되며, 연습 시간이 끝나면 자동으로 비활성화됩니다.

🚪 어떻게 들어가나요?
정문 옆에 설치된 Nuki 키패드에 PIN을 입력하시면 문이 자동으로 열립니다.

✔️ 퇴실 시 유의사항
• 퇴실하실 때 문이 제대로 닫혔는지 꼭 확인해주세요.
• 문제가 발생하면 언제든지 바로 연락주십시오.

감사합니다.

✉️ Your Practice Room Access Details

Hi there,
Thank you for booking with us!

Please find your access details below:

🔑 Access PIN: ${lockPin}
📅 Reservation: ${formattedStart} – ${formattedEnd}
📍 Address: Brunnenstraße 196, 10119 Berlin

🕒 When can I enter?
Your PIN will be active 15 minutes before your reserved time and will stop working once your session ends.

🚪 How do I get in?
Simply enter the PIN on the Nuki keypad next to the front door — the door will unlock automatically.

✔️ Before you leave:
• Please make sure the door is properly closed when you exit.
• If you run into any issues, feel free to reach out to us right away.

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

