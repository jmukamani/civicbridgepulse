import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import ForumThread from "./ForumThread.js";
import User from "./User.js";

class ForumPost extends Model {}

ForumPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ForumPost",
    tableName: "forum_posts",
    timestamps: true,
  }
);

ForumThread.hasMany(ForumPost, { foreignKey: "threadId", as: "posts" });
ForumPost.belongsTo(ForumThread, { foreignKey: "threadId" });
User.hasMany(ForumPost, { foreignKey: "authorId", as: "forumPosts" });
ForumPost.belongsTo(User, { foreignKey: "authorId", as: "author" });

export default ForumPost; 