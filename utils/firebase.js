// Firebase Admin - loaded lazily so a missing config never crashes the server
let admin = null;
let serviceAccount = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.replace(/^'|'$/g, ''));
    admin = require("firebase-admin");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin initialized");
  } else {
    console.log("⚠️ FIREBASE_SERVICE_ACCOUNT not set – push notifications disabled.");
  }
} catch (err) {
  console.error("⚠️ Firebase init failed (notifications disabled):", err.message);
}

/**
 * Sends an FCM push notification to a specific device token.
 */
async function sendPushNotification(token, title, body, data = {}) {
  if (!token || !admin || !serviceAccount) {
    return; // Silently skip – no crash
  }

  const message = {
    notification: { title, body },
    data: data,
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ FCM Push Sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending FCM Push:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendPushNotification };
