import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import PushSubscription from "../models/PushSubscription.js";
import webpush from "web-push";

// Configure VAPID keys
const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

let pushEnabled = false;
if (vapidPublic && vapidPrivate) {
  try {
    webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);
    pushEnabled = true;
  } catch (e) {
    console.error("Failed to configure web-push", e);
  }
} else {
  console.warn("VAPID keys not set – push notifications disabled");
}

export const sendNotification = async (io, userId, { type, title, body, data }) => {
  try {
    // store in DB
    const notif = await Notification.create({ userId, type, title, body, data });

    // get prefs
    const pref = await NotificationPreference.findByPk(userId);
    if (pref?.inApp !== false) {
      io.to(userId).emit("notification", notif);
    }

    // Push notifications
    if (pref?.push && pushEnabled) {
      const subs = await PushSubscription.findAll({ where: { userId } });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.toJSON(), JSON.stringify({ title: notif.title, body: notif.body, data: notif.data }));
        } catch (err) {
          console.error("webpush fail", err?.statusCode);
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await sub.destroy(); // remove invalid subscription
          }
        }
      }
    }
    // Email optional TODO
  } catch (err) {
    console.error("sendNotification error", err);
  }
}; 