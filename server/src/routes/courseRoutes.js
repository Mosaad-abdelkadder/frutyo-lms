const express = require("express");
const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const Enrollment = require("../models/Enrollment");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const courses = await Course.find()
      .populate("tutor", "name email")
      .sort({ createdAt: -1 });

    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/mine", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const query = req.user.role === "tutor" ? { tutor: req.user._id } : {};
    const courses = await Course.find(query).populate("tutor", "name email").sort({ createdAt: -1 });

    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:courseId/chapters", async (req, res) => {
  try {
    const chapters = await Chapter.find({ course: req.params.courseId }).sort({ order: 1 });
    return res.json(chapters);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate("tutor", "name email");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const chapters = await Chapter.find({ course: course._id }).sort({ order: 1 });

    return res.json({ ...course.toObject(), chapters });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const { title, description, category, price, currency, thumbnail } = req.body;

    if (!title || !description || !category || Number.isNaN(Number(price))) {
      return res.status(400).json({ message: "title, description, category and valid price are required" });
    }
    if (req.user.role === "admin" && !req.body.tutorId) {
      return res.status(400).json({ message: "tutorId is required when admin creates a course" });
    }

    const course = await Course.create({
      title,
      description,
      category,
      price,
      currency: currency || "INR",
      thumbnail: thumbnail || "",
      tutor: req.user.role === "tutor" ? req.user._id : req.body.tutorId
    });

    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:courseId", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role === "tutor" && String(course.tutor) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your courses" });
    }

    const updates = ["title", "description", "category", "price", "currency", "thumbnail"];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    if (req.user.role === "admin" && req.body.tutorId) {
      course.tutor = req.body.tutorId;
    }

    await course.save();
    return res.json(course);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:courseId", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role === "tutor" && String(course.tutor) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your courses" });
    }

    await Promise.all([
      Chapter.deleteMany({ course: course._id }),
      Enrollment.deleteMany({ course: course._id }),
      Course.deleteOne({ _id: course._id })
    ]);

    return res.json({ message: "Course deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:courseId/chapters", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role === "tutor" && String(course.tutor) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only modify your courses" });
    }

    const chapter = await Chapter.create({
      course: course._id,
      title: req.body.title,
      contentType: req.body.contentType || "video",
      contentUrl: req.body.contentUrl || "",
      durationMinutes: req.body.durationMinutes || 10,
      order: req.body.order
    });

    course.chaptersCount += 1;
    await course.save();

    return res.status(201).json(chapter);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:courseId/chapters/:chapterId", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role === "tutor" && String(course.tutor) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only modify your courses" });
    }

    const chapter = await Chapter.findOne({ _id: req.params.chapterId, course: course._id });
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const updates = ["title", "contentType", "contentUrl", "durationMinutes", "order"];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        chapter[field] = req.body[field];
      }
    });

    await chapter.save();
    return res.json(chapter);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:courseId/chapters/:chapterId", protect, authorize("admin", "tutor"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role === "tutor" && String(course.tutor) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only modify your courses" });
    }

    const chapter = await Chapter.findOne({ _id: req.params.chapterId, course: course._id });
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    await Promise.all([
      Chapter.deleteOne({ _id: chapter._id }),
      Enrollment.updateMany({ course: course._id }, { $pull: { completedChapters: chapter._id } })
    ]);

    course.chaptersCount = Math.max(0, course.chaptersCount - 1);
    await course.save();

    return res.json({ message: "Chapter deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/enrolled/me", protect, authorize("student"), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({ path: "course", populate: { path: "tutor", select: "name" } })
      .sort({ createdAt: -1 });

    return res.json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
