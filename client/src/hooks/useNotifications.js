import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import useSocket from "./useSocket.js";
import { API_BASE } from "../utils/network.js";

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useSocket();
  const [page, setPage] = useState(1);

  const load = async (pageNum = 1, append = false) => {
    try {
      const res = await axios.get(`${API_BASE}/api/notifications?page=${pageNum}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setNotifications((prev) => (append ? [...prev, ...res.data] : res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [socketRef]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (ids) => {
    try {
      await axios.post(
        `${API_BASE}/api/notifications/mark-read`,
        { ids },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  // Push subscription (one-time)
  useEffect(() => {
    const setupPush = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
        const reg = await navigator.serviceWorker.getRegistration(swUrl) || await navigator.serviceWorker.register(swUrl, import.meta.env.DEV ? { type: 'module' } : {});
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const existing = await reg.pushManager.getSubscription();
        if (!existing) {
          const vapidPublic = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (!vapidPublic) return;
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublic) });
          await axios.post(`${API_BASE}/api/notifications/subscribe`, sub.toJSON(), { headers: { Authorization: `Bearer ${getToken()}` } });
        }
      } catch (e) { console.error('push setup', e); }
    };
    setupPush();
  }, []);

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return { notifications, unreadCount, markRead, reload: () => load(1), loadMore };
};

export default useNotifications; 