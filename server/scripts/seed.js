require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDb = require("../src/config/db");
const User = require("../src/models/User");
const Course = require("../src/models/Course");
const Chapter = require("../src/models/Chapter");
const Enrollment = require("../src/models/Enrollment");

const seed = async () => {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Chapter.deleteMany({}),
    Enrollment.deleteMany({})
  ]);

  const [adminPassword, tutorPassword, studentPassword] = await Promise.all([
    bcrypt.hash("Admin@123", 10),
    bcrypt.hash("Tutor@123", 10),
    bcrypt.hash("Student@123", 10)
  ]);

  const admin = await User.create({
    name: "Aarav Admin",
    email: "admin@lms.com",
    password: adminPassword,
    role: "admin"
  });

  const tutors = await User.insertMany([
    {
      name: "Nisha Tutor",
      email: "tutor1@lms.com",
      password: tutorPassword,
      role: "tutor"
    },
    {
      name: "Kabir Tutor",
      email: "tutor2@lms.com",
      password: tutorPassword,
      role: "tutor"
    }
  ]);

  const students = await User.insertMany([
    {
      name: "Riya Student",
      email: "student1@lms.com",
      password: studentPassword,
      role: "student"
    },
    {
      name: "Arjun Student",
      email: "student2@lms.com",
      password: studentPassword,
      role: "student"
    },
    {
      name: "Meera Student",
      email: "student3@lms.com",
      password: studentPassword,
      role: "student"
    }
  ]);

  const courses = await Course.insertMany([
    {
      title: "MERN Stack Masterclass",
      description: "Build production-ready full stack apps using MongoDB, Express, React, and Node.js.",
      category: "Web Development",
      price: 2499,
      currency: "INR",
      tutor: tutors[0]._id,
      chaptersCount: 4,
      enrollmentCount: 2,
      thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
    },
    {
      title: "Data Structures and Algorithms in JavaScript",
      description: "Crack coding interviews with hands-on DSA in JavaScript.",
      category: "Programming",
      price: 1999,
      currency: "INR",
      tutor: tutors[1]._id,
      chaptersCount: 4,
      enrollmentCount: 2,
      thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
    },
    {
      title: "UI/UX Foundations for Developers",
      description: "Learn practical UX principles and UI patterns for modern products.",
      category: "Design",
      price: 0,
      currency: "INR",
      tutor: tutors[0]._id,
      chaptersCount: 3,
      enrollmentCount: 1,
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
    }
  ]);

  const chapterPayload = [
    [
      { title: "Project Setup and Architecture", contentType: "video", durationMinutes: 24, order: 1 },
      { title: "Authentication and RBAC", contentType: "video", durationMinutes: 32, order: 2 },
      { title: "Course APIs and React Integration", contentType: "video", durationMinutes: 40, order: 3 },
      { title: "Deploying with CloudPanel", contentType: "article", durationMinutes: 18, order: 4 }
    ],
    [
      { title: "Big-O, Arrays, and Strings", contentType: "video", durationMinutes: 28, order: 1 },
      { title: "Stacks, Queues, and Linked Lists", contentType: "video", durationMinutes: 35, order: 2 },
      { title: "Trees and Graph Traversals", contentType: "video", durationMinutes: 44, order: 3 },
      { title: "Interview Problem Solving", contentType: "quiz", durationMinutes: 20, order: 4 }
    ],
    [
      { title: "Design Thinking Basics", contentType: "video", durationMinutes: 17, order: 1 },
      { title: "Visual Hierarchy and Layout", contentType: "article", durationMinutes: 15, order: 2 },
      { title: "Rapid Wireframing", contentType: "video", durationMinutes: 19, order: 3 }
    ]
  ];

  for (let i = 0; i < courses.length; i += 1) {
    const chapters = chapterPayload[i].map((chapter) => ({
      ...chapter,
      course: courses[i]._id,
      contentUrl: "https://example.com/content"
    }));
    await Chapter.insertMany(chapters);
  }

  const courseOneChapters = await Chapter.find({ course: courses[0]._id }).sort({ order: 1 });
  const courseTwoChapters = await Chapter.find({ course: courses[1]._id }).sort({ order: 1 });
  const courseThreeChapters = await Chapter.find({ course: courses[2]._id }).sort({ order: 1 });

  await Enrollment.insertMany([
    {
      student: students[0]._id,
      course: courses[0]._id,
      paidAmount: 2499,
      paymentStatus: "paid",
      razorpayOrderId: "seed_order_1",
      razorpayPaymentId: "seed_payment_1",
      completedChapters: [courseOneChapters[0]._id, courseOneChapters[1]._id],
      progressPercent: 50,
      points: 30
    },
    {
      student: students[1]._id,
      course: courses[0]._id,
      paidAmount: 2499,
      paymentStatus: "paid",
      razorpayOrderId: "seed_order_2",
      razorpayPaymentId: "seed_payment_2",
      completedChapters: [courseOneChapters[0]._id, courseOneChapters[1]._id, courseOneChapters[2]._id],
      progressPercent: 75,
      points: 45
    },
    {
      student: students[0]._id,
      course: courses[1]._id,
      paidAmount: 1999,
      paymentStatus: "paid",
      razorpayOrderId: "seed_order_3",
      razorpayPaymentId: "seed_payment_3",
      completedChapters: [courseTwoChapters[0]._id],
      progressPercent: 25,
      points: 15
    },
    {
      student: students[2]._id,
      course: courses[1]._id,
      paidAmount: 1999,
      paymentStatus: "paid",
      razorpayOrderId: "seed_order_4",
      razorpayPaymentId: "seed_payment_4",
      completedChapters: courseTwoChapters.map((chapter) => chapter._id),
      progressPercent: 100,
      points: 160
    },
    {
      student: students[2]._id,
      course: courses[2]._id,
      paidAmount: 0,
      paymentStatus: "free",
      completedChapters: [courseThreeChapters[0]._id],
      progressPercent: 33,
      points: 15
    }
  ]);

  console.log("Seed complete");
  console.log("Admin:", admin.email, "Admin@123");
  console.log("Tutor:", tutors[0].email, "Tutor@123");
  console.log("Student:", students[0].email, "Student@123");

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
