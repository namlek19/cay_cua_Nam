import mongoose from "mongoose";

const TreeStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main_tree",
      unique: true,
    },
    ownerWaterCount: {
      type: Number,
      default: 0,
    },
    guestWaterCount: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastOwnerWaterDate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const BranchSchema = new mongoose.Schema({
  visitorHash: {
    type: String,
    required: true,
    index: true,
  },
  dateStr: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    default: null,
  },
  waterCountOnBranch: {
    type: Number,
    default: 1,
  },
  note: {
    type: String,
    default: "",
    maxLength: 500,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const TreeState =
  mongoose.models.TreeState || mongoose.model("TreeState", TreeStateSchema);

export const Branch =
  mongoose.models.Branch || mongoose.model("Branch", BranchSchema);

