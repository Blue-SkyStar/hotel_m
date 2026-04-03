const admin = require("firebase-admin");

// Initialize Firebase Admin gracefully handling Env parsing
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.replace(/^'|'$/g, ''));
  }
} catch (err) {
  console.log("⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT. Push notifications may fail.", err.message);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.log("⚠️ Firebase Admin is bypassed because FIREBASE_SERVICE_ACCOUNT is not set.");
}

/**
 * Sends an FCM push notification to a specific device token.
 */
async function sendPushNotification(token, title, body, data = {}) {
  if (!token || !serviceAccount) return console.log('⚠️ Notice: Skipped Push (No FCM token or Service Account config provided)');

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

module.exports = { admin, sendPushNotification };
