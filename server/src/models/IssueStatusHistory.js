import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Issue from "./Issue.js";
import User from "./User.js";

class IssueStatusHistory extends Model {}

IssueStatusHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    issueId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "IssueStatusHistory",
    tableName: "issue_status_history",
    timestamps: true,
    updatedAt: false,
  }
);

Issue.hasMany(IssueStatusHistory, { foreignKey: "issueId", as: "history" });
IssueStatusHistory.belongsTo(Issue, { foreignKey: "issueId" });
User.hasMany(IssueStatusHistory, { foreignKey: "changedBy" });
IssueStatusHistory.belongsTo(User, { foreignKey: "changedBy", as: "changer" });

export default IssueStatusHistory; 