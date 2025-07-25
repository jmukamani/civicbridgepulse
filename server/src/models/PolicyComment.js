import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import PolicyDocument from "./PolicyDocument.js";
import User from "./User.js";

class PolicyComment extends Model {}

PolicyComment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    policyId: {
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
    modelName: "PolicyComment",
    tableName: "policy_comments",
    timestamps: true,
  }
);

PolicyDocument.hasMany(PolicyComment, { foreignKey: "policyId", as: "comments" });
PolicyComment.belongsTo(PolicyDocument, { foreignKey: "policyId" });
User.hasMany(PolicyComment, { foreignKey: "authorId", as: "policyComments" });
PolicyComment.belongsTo(User, { foreignKey: "authorId", as: "author" });

export default PolicyComment; 