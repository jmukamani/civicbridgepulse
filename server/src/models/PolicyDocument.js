import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class PolicyDocument extends Model {}

PolicyDocument.init(
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
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("budget", "development", "bylaw", "other"),
      defaultValue: "other",
    },
    summary_en: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    summary_sw: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    budget: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("published", "draft", "review"),
      defaultValue: "published",
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "PolicyDocument",
    tableName: "policy_documents",
    timestamps: true,
  }
);

User.hasMany(PolicyDocument, { foreignKey: "uploadedBy", as: "policyDocs" });
PolicyDocument.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });

export default PolicyDocument; 