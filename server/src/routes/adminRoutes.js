const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", protect, authorize("admin"), async (_req, res) => {
  try {
    const [users, courses, enrollments] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments()
    ]);

    const revenue = await Enrollment.aggregate([
      { $group: { _id: null, total: { $sum: "$paidAmount" } } }
    ]);

    return res.json({
      users,
      courses,
      enrollments,
      revenue: revenue[0]?.total || 0
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/users", protect, authorize("admin"), async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/users/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);

    await user.save();
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/users/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot delete your own admin account" });
    }

    if (user.role === "tutor") {
      const tutorCourses = await Course.countDocuments({ tutor: user._id });
      if (tutorCourses > 0) {
        return res.status(400).json({ message: "Cannot delete tutor with active courses" });
      }
    }

    if (user.role === "student") {
      const enrollments = await Enrollment.find({ student: user._id });
      const courseCountById = new Map();
      enrollments.forEach((item) => {
        const key = String(item.course);
        courseCountById.set(key, (courseCountById.get(key) || 0) + 1);
      });

      await Enrollment.deleteMany({ student: user._id });
      await Promise.all(
        [...courseCountById.entries()].map(async ([courseId, count]) => {
          const course = await Course.findById(courseId);
          if (course) {
            course.enrollmentCount = Math.max(0, (course.enrollmentCount || 0) - count);
            await course.save();
          }
        })
      );
    }

    await User.deleteOne({ _id: user._id });
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
