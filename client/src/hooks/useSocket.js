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

    socket.on("policy_comment", ({ policyId }) => {
      notifyInfo("New feedback on one of your policies");
    });

    socket.on("event_new", () => {
      notifyInfo("New civic event scheduled");
    });

    socket.on("issue_status", ({ issueId, status }) => {
      notifyInfo(`Issue status updated to ${status.replace(/_/g, " ")}`);
      window.dispatchEvent(new CustomEvent("issue_status", { detail: { issueId, status } }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
};

export default useSocket; 