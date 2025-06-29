import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Poll from "./Poll.js";
import User from "./User.js";

class PollVote extends Model {}

PollVote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pollId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    voterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    selected: {
      // store selected option indices (array for multiple or single element)
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "PollVote",
    tableName: "poll_votes",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["pollId", "voterId"] }, // one vote per poll per user
    ],
  }
);

Poll.hasMany(PollVote, { foreignKey: "pollId", as: "votes" });
PollVote.belongsTo(Poll, { foreignKey: "pollId" });
User.hasMany(PollVote, { foreignKey: "voterId", as: "pollVotes" });
PollVote.belongsTo(User, { foreignKey: "voterId", as: "voter" });

export default PollVote; 