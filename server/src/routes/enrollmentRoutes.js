const express = require("express");
const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, authorize("admin"), async (_req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("student", "name email role")
      .populate("course", "title price")
      .sort({ createdAt: -1 });
    return res.json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, authorize("student"), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate("course")
      .sort({ createdAt: -1 });

    return res.json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:enrollmentId", protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate("student", "name email role")
      .populate("course", "title price");
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const isOwner = String(enrollment.student?._id || enrollment.student) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:courseId/progress", protect, authorize("student"), async (req, res) => {
  try {
    const { chapterId } = req.body;
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "Invalid chapter id" });
    }

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const chapter = await Chapter.findOne({ _id: chapterId, course: courseId });
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found for course" });
    }

    if (!enrollment.completedChapters.find((item) => String(item) === String(chapter._id))) {
      enrollment.completedChapters.push(chapter._id);
    }

    const totalChapters = await Chapter.countDocuments({ course: courseId });
    const completed = enrollment.completedChapters.length;
    enrollment.progressPercent = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;
    enrollment.points = completed * 15 + (enrollment.progressPercent === 100 ? 100 : 0);

    await enrollment.save();

    return res.json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:enrollmentId", protect, authorize("admin"), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const updatable = ["paidAmount", "paymentStatus", "progressPercent", "points"];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        enrollment[field] = req.body[field];
      }
    });

    await enrollment.save();
    return res.json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:enrollmentId", protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const isOwner = String(enrollment.student) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Enrollment.deleteOne({ _id: enrollment._id });
    const course = await Course.findById(enrollment.course);
    if (course) {
      course.enrollmentCount = Math.max(0, (course.enrollmentCount || 0) - 1);
      await course.save();
    }

    return res.json({ message: "Enrollment deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/leaderboard/global", protect, async (_req, res) => {
  try {
    const leaderboard = await Enrollment.aggregate([
      {
        $group: {
          _id: "$student",
          totalPoints: { $sum: "$points" },
          avgProgress: { $avg: "$progressPercent" },
          coursesEnrolled: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1, avgProgress: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $project: {
          _id: 0,
          studentId: "$student._id",
          name: "$student.name",
          email: "$student.email",
          totalPoints: 1,
          avgProgress: { $round: ["$avgProgress", 0] },
          coursesEnrolled: 1
        }
      }
    ]);

    return res.json(leaderboard);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/tutor/overview", protect, authorize("tutor", "admin"), async (req, res) => {
  try {
    const query = req.user.role === "tutor" ? { tutor: req.user._id } : {};
    const courses = await Course.find(query);
    const courseIds = courses.map((course) => course._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } });
    const revenue = enrollments.reduce((sum, item) => sum + item.paidAmount, 0);

    return res.json({
      courseCount: courses.length,
      enrollmentCount: enrollments.length,
      revenue,
      avgProgress:
        enrollments.length > 0
          ? Math.round(enrollments.reduce((sum, item) => sum + item.progressPercent, 0) / enrollments.length)
          : 0
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
