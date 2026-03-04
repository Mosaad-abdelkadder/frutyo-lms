const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ["video", "article", "quiz"],
      default: "video"
    },
    contentUrl: { type: String, default: "" },
    durationMinutes: { type: Number, default: 10 },
    order: { type: Number, required: true }
  },
  { timestamps: true }
);

chapterSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
