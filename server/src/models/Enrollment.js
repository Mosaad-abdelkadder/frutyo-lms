const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "free"],
      default: "pending"
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    completedChapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
    progressPercent: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
