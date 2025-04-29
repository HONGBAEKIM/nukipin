<!-- import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

// The original event handler (keeping it)
export async function wixBookings_onBookingConfirmed(event) {
    console.log("🚀 [TEST] Booking Confirmed Triggered:", JSON.stringify(event, null, 2));
    const eventTrigger = event.trigger;
    const bookingId = event.booking._id;
    console.log("🎯 [EVENT] Trigger Type:", eventTrigger);
    console.log("🆔 [EVENT] Booking ID:", bookingId);
    await handleBookingEvent(event);
  }
  
  // New event handlers to catch real booking triggers
  export async function wixBookings_onBookingCreated(event) {
    console.log("🆕 [REAL] wixBookings_onBookingCreated fired");
    console.log(JSON.stringify(event, null, 2));
  }
  
  export async function wixBookings_onBookingPaid(event) {
    console.log("💰 [REAL] wixBookings_onBookingPaid fired");
    console.log(JSON.stringify(event, null, 2));
  }
  
  export async function wixBookings_onBookingApproved(event) {
    console.log("✅ [REAL] wixBookings_onBookingApproved fired");
    console.log(JSON.stringify(event, null, 2));
  }

async function handleBookingEvent(event) {
    try {
      const secret = await getSecret("secret");
      console.log("🔑 [EVENT] Got secret!");
  
      const booking = event.booking;
      const eventTrigger = event.trigger; // <-- ADD trigger inside handler
  
      if (!booking) {
        console.error("❌ No booking object found in event");
        return;
      }
  
      const email = booking.formInfo?.contactDetails?.email;
      const room = booking.bookedEntity?.title || "Practice Room";
      const startTime = booking.bookedEntity?.singleSession?.start;
      const endTime = booking.bookedEntity?.singleSession?.end;
  
      if (!email || !startTime || !endTime) {
        console.error("❌ Missing important booking fields:", { email, startTime, endTime });
        return;
      }
  
      console.log("📧 Email:", email);
      console.log("🏠 Room:", room);
      console.log("⏰ Start:", startTime);
      console.log("⏰ End:", endTime);
      console.log("🎯 Trigger:", eventTrigger); // <-- LOG trigger inside the handler too
  
      console.log("📡 Sending request to backend...");
      const response = await fetch("http://HERE SHOULD BE SERVER'S IP:3000/create-pin", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": secret
        },
        body: JSON.stringify({
          email,
          room,
          startTime,
          endTime,
          trigger: eventTrigger // <-- Optionally send trigger too!
        })
      });
  
      if (!response.ok) {
        console.error("❌ Server responded with status:", response.status);
        return;
      }
  
      const result = await response.json();
      console.log("✅ Server Response:", result);
  
    } catch (err) {
      console.error("❌ Error in handleBookingEvent:", err.message || err);
    }
  }
   -->