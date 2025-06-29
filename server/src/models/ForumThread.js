import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class ForumThread extends Model {}

ForumThread.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ForumThread",
    tableName: "forum_threads",
    timestamps: true,
  }
);

User.hasMany(ForumThread, { foreignKey: "createdBy", as: "forumThreads" });
ForumThread.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

export default ForumThread; 