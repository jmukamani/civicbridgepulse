import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken, getUser } from "../utils/auth.js";
import { notifyInfo } from "../utils/notifications.js";

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    const socket = io("http://localhost:5000", {
      auth: {
        token: getToken(),
      },
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

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
};

export default useSocket; 