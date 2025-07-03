import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class PushSubscription extends Model {}

PushSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keys: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "PushSubscription",
    tableName: "push_subscriptions",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId", "endpoint"] },
    ],
  }
);

User.hasMany(PushSubscription, { foreignKey: "userId", as: "pushSubscriptions" });
PushSubscription.belongsTo(User, { foreignKey: "userId", as: "user" });

export default PushSubscription; 