import Interaction from "../models/Interaction.js";

export const logInteraction = async (userId, type, refId = null) => {
  try {
    await Interaction.create({ userId, type, refId });
  } catch (err) {
    console.error("logInteraction error", err);
  }
}; 