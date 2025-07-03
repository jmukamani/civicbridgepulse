import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class Poll extends Model {}

Poll.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    options: {
      // array of option strings stored as JSON
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    multiple: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "open", "closed"),
      defaultValue: "open",
    },
    opensAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closesAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    discussionThreadId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Poll",
    tableName: "polls",
    timestamps: true,
  }
);

User.hasMany(Poll, { foreignKey: "createdBy", as: "createdPolls" });
Poll.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

export default Poll; 