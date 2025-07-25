import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

class RepresentativeRating extends Model {}

RepresentativeRating.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    representativeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    responsiveness: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    issueResolution: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    engagement: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issueId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    messageThreadId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "RepresentativeRating",
    tableName: "representative_ratings",
    timestamps: true,
  }
);

User.hasMany(RepresentativeRating, { foreignKey: "representativeId", as: "ratings" });
RepresentativeRating.belongsTo(User, { foreignKey: "representativeId", as: "representative" });

export default RepresentativeRating; 