import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class NotificationPreference extends Model {}

NotificationPreference.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    inApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    push: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "NotificationPreference",
    tableName: "notification_preferences",
    timestamps: false,
  }
);

User.hasOne(NotificationPreference, { foreignKey: "userId", as: "notificationPreference" });
NotificationPreference.belongsTo(User, { foreignKey: "userId", as: "user" });

export default NotificationPreference; 