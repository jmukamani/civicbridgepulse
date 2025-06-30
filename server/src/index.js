import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import Message from "./models/Message.js";
import usersRoutes from "./routes/users.js";
import policiesRoutes from "./routes/policies.js";
import issuesRoutes from "./routes/issues.js";
import pollsRoutes from "./routes/polls.js";
import policyCommentsRoutes from "./routes/policyComments.js";
import forumsRoutes from "./routes/forums.js";
import analyticsRoutes from "./routes/analytics.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/policies", policiesRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/polls", pollsRoutes);
app.use("/api/policies", policyCommentsRoutes);
app.use("/api/forums", forumsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Swagger docs endpoints
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

// static serve uploads
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Database connected and synced");

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Socket.io setup
    const { Server } = await import("socket.io");
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
      },
    });

    io.on("connection", (socket) => {
      console.log("socket connected", socket.id);
      socket.on("join", (userId) => {
        socket.join(userId);
      });

      socket.on("delivered", async ({ messageId }) => {
        const msg = await Message.findByPk(messageId);
        if (msg && !msg.deliveredAt) {
          msg.deliveredAt = new Date();
          await msg.save();
          io.to(msg.senderId).emit("message_delivered", { id: msg.id });
        }
      });
    });

    // export io to use in routes (quick way)
    app.set("io", io);
  } catch (err) {
    console.error("Unable to connect to DB", err);
  }
})(); 