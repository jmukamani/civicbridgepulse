import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Message from "./Message.js";
import User from "./User.js";

class MessageRating extends Model {}

MessageRating.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    raterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  { sequelize, modelName: "MessageRating", tableName: "message_ratings", timestamps: true }
);

Message.hasMany(MessageRating, { foreignKey: "messageId", as: "ratings" });
MessageRating.belongsTo(Message, { foreignKey: "messageId" });
User.hasMany(MessageRating, { foreignKey: "raterId" });
MessageRating.belongsTo(User, { foreignKey: "raterId", as: "rater" });

export default MessageRating; 