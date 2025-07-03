import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class Issue extends Model {}

Issue.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "infrastructure",
        "service",
        "environment",
        "security",
        "other"
      ),
      defaultValue: "other",
    },
    status: {
      type: DataTypes.ENUM(
        "reported",
        "acknowledged",
        "in_progress",
        "blocked",
        "under_review",
        "resolved",
        "closed"
      ),
      defaultValue: "reported",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    citizenId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    representativeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ward: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Issue",
    tableName: "issues",
    timestamps: true,
  }
);

// Associations
User.hasMany(Issue, { foreignKey: "citizenId", as: "reportedIssues" });
Issue.belongsTo(User, { foreignKey: "citizenId", as: "citizen" });

User.hasMany(Issue, { foreignKey: "representativeId", as: "assignedIssues" });
Issue.belongsTo(User, { foreignKey: "representativeId", as: "representative" });

export default Issue; 