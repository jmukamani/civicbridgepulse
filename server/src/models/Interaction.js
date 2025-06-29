import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class Interaction extends Model {}

Interaction.init(
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
    type: {
      type: DataTypes.ENUM("message", "issue", "poll_vote", "policy_view", "forum_post"),
      allowNull: false,
    },
    refId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Interaction", tableName: "interactions", timestamps: true }
);

User.hasMany(Interaction, { foreignKey: "userId", as: "interactions" });
Interaction.belongsTo(User, { foreignKey: "userId" });

export default Interaction; 