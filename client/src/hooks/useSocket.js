import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken, getUser } from "../utils/auth.js";
import { notifyInfo } from "../utils/notifications.js";

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    let socket;

    const connect = () => {
      if (socket || !navigator.onLine) return;
      socket = io("http://localhost:5000", {
        auth: { token: getToken() },
        reconnection: false, // we will handle reconnection manually
        transports: ["websocket", "polling"],
      });
      socket.emit("join", user.id);
      socketRef.current = socket;

      // delivered ack helper
      socket.on("new_message", (msg) => {
        if (msg.recipientId === user.id) {
          socket.emit("delivered", { messageId: msg.id });
          notifyInfo("New message received");
        }
      });

      socket.on("policy_comment", () => {
        notifyInfo("New feedback on one of your policies");
      });

      socket.on("event_new", () => {
        notifyInfo("New civic event scheduled");
      });

      socket.on("issue_status", ({ issueId, status }) => {
        notifyInfo(`Issue status updated to ${status.replace(/_/g, " ")}`);
        window.dispatchEvent(new CustomEvent("issue_status", { detail: { issueId, status } }));
      });
    };

    const disconnect = () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        socketRef.current = null;
      }
    };

    // initial connect if online
    connect();

    // listen to network changes
    const handleOnline = () => connect();
    const handleOffline = () => disconnect();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      disconnect();
    };
  }, []);

  return socketRef;
};

export default useSocket; 