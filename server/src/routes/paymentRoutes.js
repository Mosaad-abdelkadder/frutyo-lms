const express = require("express");
const Razorpay = require("razorpay");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { protect, authorize } = require("../middleware/auth");
const { hasRazorpayKeys, verifyRazorpaySignature } = require("../utils/razorpay");

const router = express.Router();

const razorpay = hasRazorpayKeys()
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

router.get("/config", protect, authorize("student", "admin", "tutor"), async (_req, res) => {
  return res.json({
    enabled: Boolean(razorpay),
    key: process.env.RAZORPAY_KEY_ID || "",
    mode: razorpay ? "live_or_test" : "mock"
  });
});

router.post("/create-order", protect, authorize("student"), async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const exists = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (exists) {
      return res.status(409).json({ message: "Already enrolled" });
    }

    if (course.price === 0) {
      const enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
        paidAmount: 0,
        paymentStatus: "free"
      });
      course.enrollmentCount += 1;
      await course.save();
      return res.status(201).json({ freeEnrollment: true, enrollment });
    }

    if (!razorpay) {
      return res.json({
        order: {
          id: `mock_order_${Date.now()}`,
          amount: Math.round(course.price * 100),
          currency: course.currency
        },
        mockMode: true,
        key: "rzp_test_mock"
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(course.price * 100),
      currency: course.currency,
      notes: {
        courseId: String(course._id),
        studentId: String(req.user._id)
      }
    });

    return res.json({ order, key: process.env.RAZORPAY_KEY_ID, mockMode: false });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/verify", protect, authorize("student"), async (req, res) => {
  try {
    const { courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature, mockMode } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const exists = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (exists) {
      return res.status(409).json({ message: "Already enrolled" });
    }

    let verified = false;

    if (mockMode) {
      verified = razorpay_payment_id?.startsWith("mock_pay_") && razorpay_signature === "mock_signature";
    } else {
      if (!razorpay) {
        return res.status(400).json({ message: "Razorpay is not configured on server" });
      }

      verified = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      });

      if (verified) {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const expectedAmount = Math.round(course.price * 100);
        const statusOk = ["authorized", "captured"].includes(payment.status);
        const orderMatches = payment.order_id === razorpay_order_id;
        const amountMatches = payment.amount === expectedAmount;

        verified = statusOk && orderMatches && amountMatches;
      }
    }

    if (!verified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      paidAmount: course.price,
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    });

    course.enrollmentCount += 1;
    await course.save();

    return res.status(201).json({ message: "Enrollment successful", enrollment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
