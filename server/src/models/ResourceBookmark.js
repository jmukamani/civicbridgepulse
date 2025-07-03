import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Resource from "./Resource.js";
import User from "./User.js";

class ResourceBookmark extends Model {}

ResourceBookmark.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ResourceBookmark",
    tableName: "resource_bookmarks",
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ["resourceId", "userId"] }],
  }
);

Resource.hasMany(ResourceBookmark, { foreignKey: "resourceId", as: "bookmarks" });
ResourceBookmark.belongsTo(Resource, { foreignKey: "resourceId" });
User.hasMany(ResourceBookmark, { foreignKey: "userId", as: "resourceBookmarks" });
ResourceBookmark.belongsTo(User, { foreignKey: "userId", as: "user" });

export default ResourceBookmark; 