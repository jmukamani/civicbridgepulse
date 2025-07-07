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
import resourcesRoutes from "./routes/resources.js";
import notificationsRoutes from "./routes/notifications.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import eventsRoutes from "./routes/events.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
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
app.use("/api/resources", resourcesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/events", eventsRoutes);

// Swagger docs endpoints
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

// static serve uploads
app.use("/uploads", express.static("uploads"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, "..", "public");
app.use(express.static(buildPath));

app.get(/^((?!^\/api).)*$/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Database connected and synced");

    // Ensure text-search index for resources
    try {
      await sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
      await sequelize.query(
        "CREATE INDEX IF NOT EXISTS idx_resources_search ON resources USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));"
      );
    } catch (e) {
      console.error("FTS index creation failed", e);
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Initialize Socket.IO
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

    app.set("io", io);
  } catch (err) {
    console.error("Unable to connect to DB", err);
  }
})(); 