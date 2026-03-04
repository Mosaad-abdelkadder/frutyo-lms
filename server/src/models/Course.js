const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    thumbnail: { type: String, default: "" },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chaptersCount: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
