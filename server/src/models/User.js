import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("citizen", "representative", "admin"),
      defaultValue: "citizen",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Representative verification fields
    isRepVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "not_required"),
      defaultValue: "not_required",
    },
    verificationDocs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON string containing verification document paths and details",
    },
    // Representative specialization areas
    specializations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: "Areas of expertise for representatives: water, sanitation, infrastructure, etc.",
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ward: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ageRange: {
      type: DataTypes.ENUM("18-24", "25-34", "35-44", "45-54", "55+"),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

export default User; 