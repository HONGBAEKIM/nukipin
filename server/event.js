// this code is for wix velo 

// import { fetch } from 'wix-fetch';
// import { getSecret } from 'wix-secrets-backend';
// import { getServiceBookings } from 'wix-bookings-backend';

// export async function wixPay_onPaymentUpdate(event) {
//   if (event.status !== "Successful") return;

//   try {
//     const secret = await getSecret("PIN_API_SECRET");
//     const email = event.userInfo?.email;

//     if (!email) throw new Error("Missing customer email");

//     const now = new Date();
//     const startOfToday = new Date(now);
//     startOfToday.setHours(0, 0, 0, 0);
//     const endOfToday = new Date(now);
//     endOfToday.setHours(23, 59, 59, 999);

//     // 🔍 Get all today's bookings for this user
//     const { bookings } = await getServiceBookings({
//       fieldsets: ['basic'],
//       filter: {
//         "userEmail": email
//       },
//       paging: { limit: 20 }
//     });

//     const todayBookings = bookings.filter(b => {
//       const bookingStart = new Date(b.start);
//       return bookingStart >= startOfToday && bookingStart <= endOfToday;
//     });

//     if (!todayBookings.length) {
//       console.log(`ℹ️ No bookings today for ${email}`);
//       return;
//     }

//     // 🕒 Calculate earliest start and latest end
//     const startTimes = todayBookings.map(b => new Date(b.start));
//     const endTimes = todayBookings.map(b => new Date(b.end));

//     const earliestStart = new Date(Math.min(...startTimes));
//     const latestEnd = new Date(Math.max(...endTimes));

//     const room = todayBookings[0]?.location?.name || "Practice Room";

//     // 🔐 Send combined booking window to backend
//     await fetch("http://94.72.141.94:3000/create-pin", {
//       method: "post",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-secret": secret
//       },
//       body: JSON.stringify({
//         email,
//         room,
//         startTime: earliestStart.toISOString(),
//         endTime: latestEnd.toISOString()
//       })
//     });

//     console.log(`✅ PIN created for ${email}: ${earliestStart.toISOString()} – ${latestEnd.toISOString()}`);
//   } catch (err) {
//     console.error("❌ Error in wixPay_onPaymentUpdate:", err.message || err);
//   }
// }
