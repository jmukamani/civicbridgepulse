import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Event from "./Event.js";
import User from "./User.js";

class EventRSVP extends Model {}

EventRSVP.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("going", "not_going", "maybe"),
      defaultValue: "going",
    },
  },
  {
    sequelize,
    modelName: "EventRSVP",
    tableName: "event_rsvps",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["eventId", "userId"],
      },
    ],
  }
);

Event.hasMany(EventRSVP, { foreignKey: "eventId", as: "rsvps" });
EventRSVP.belongsTo(Event, { foreignKey: "eventId", as: "event" });
User.hasMany(EventRSVP, { foreignKey: "userId", as: "eventRsvps" });
EventRSVP.belongsTo(User, { foreignKey: "userId", as: "user" });

export default EventRSVP; 