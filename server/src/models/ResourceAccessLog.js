import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Resource from "./Resource.js";
import User from "./User.js";

class ResourceAccessLog extends Model {}

ResourceAccessLog.init(
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
    accessedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ResourceAccessLog",
    tableName: "resource_access_logs",
    createdAt: false,
    updatedAt: false,
  }
);

Resource.hasMany(ResourceAccessLog, { foreignKey: "resourceId", as: "accessLogs" });
ResourceAccessLog.belongsTo(Resource, { foreignKey: "resourceId" });
User.hasMany(ResourceAccessLog, { foreignKey: "userId", as: "resourceAccesses" });
ResourceAccessLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export default ResourceAccessLog; 