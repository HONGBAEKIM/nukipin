# nuki
before run the docker compose these should be installed


sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v


npm init -y
npm install express axios nodemailer dotenv



Cases Your Code Handles
💡 1. Customer books 1 hour
✅ A 6-digit PIN is generated using their email + date.
✅ PIN is valid 15 minutes before booking until booking end.
✅ PIN is created on all Nuki locks.
✅ An email is sent with full instructions and time.
✅ Any expired PINs on the locks are auto-deleted before this.

💡 2. Customer books multiple non-overlapping hours (same day)
Example: 10:00–11:00 and 16:00–17:00
✅ The same PIN is reused (based on email + date).

⚠️ But right now, each booking creates a separate time-limited PIN, so if booked back-to-back, they are overwritten — that's okay for your logic since the PIN is the same and gets extended in each new creation.

💡 3. Customer books back-to-back hours (e.g. 13:00–14:00 and 14:00–15:00)
✅ Same PIN is reused (email + date)
✅ Each new booking extends the end time — effectively keeping the door accessible across both periods.
🔐 So the customer never needs a new code.

💡 4. Different customers book adjacent slots
Example:

A books 13:00–14:00
B books 14:00–15:00
→ Result:

🔐 A gets PIN 123456, valid 12:45–14:00
🔐 B gets PIN 654321, valid 13:45–15:00
✅ During the 15-minute overlap (13:45–14:00), both codes work (this is allowed by Nuki!)

💡 5. Customer books on a different day
✅ A new PIN will be generated (same email + different date = different PIN).
✅ Expired PINs from yesterday are removed before a new one is created.

💡 6. Customer books multiple rooms
✅ Your logic does not restrict by room.
✅ Regardless of which room they book, the same lock(s) get the code — which is good, since toilets are shared.
✅ The room name is only used in the email for info.

💡 7. Customer makes a new booking after already receiving a PIN
✅ They get another email with the same PIN (if same day).
✅ This reinforces the info and time range.
✅ Even if you call the API again, Nuki just replaces the PIN with the updated time range.

💡 8. PIN expires
✅ On each booking, expired PINs are deleted from the lock before new one is added.

💡 9. List of all current/expired PINs
✅ Your /list-pins route shows all active/expired PINs per lock.
✅ Shows: lock ID, PIN, name (email), time range, expired status.

🔒 Things You Don’t Do (yet — but could)
Feature	Status	Notes
Automatically extend PIN when more bookings come in	✅ (indirectly)	Because the code is based on date, re-creating the PIN updates it
Block same user from getting a new code same day	✅	Reuse by hash, not random
Add a webhook to delete expired codes via cron	❌	Optional future feature
Use separate PIN per lock	❌	You currently use the same PIN on all locks, which is intentional for toilet access


To get lockID

curl -X GET https://api.nuki.io/smartlock \
  -H "Authorization: Bearer 014f286c457e9a23f48483a70f4d89b340a7c96c4363e1006f346f251742936c9a486c19c8044ee9" \
  -H "Content-Type: application/json"

  