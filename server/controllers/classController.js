const asyncHandler = require('../utils/asyncHandler');
const classService = require('../services/class/classService');

// ---------- Teacher actions ----------
const createClass = asyncHandler(async (req, res) => {
  const newClass = await classService.createClass(req.user, req.body.name);
  res.status(201).json({ success: true, message: 'Class created.', data: { class: newClass } });
});

const listMyClasses = asyncHandler(async (req, res) => {
  const classes = await classService.listClassesForTeacher(req.user);
  res.status(200).json({ success: true, data: { classes } });
});

const getClassDetail = asyncHandler(async (req, res) => {
  const { classDoc, students } = await classService.getClassDetailForTeacher(req.user, req.params.classId);
  res.status(200).json({ success: true, data: { class: classDoc, students } });
});

// ---------- Student actions ----------
const joinClass = asyncHandler(async (req, res) => {
  const result = await classService.joinClassByKey(req.user, req.body.classKey);
  res.status(200).json({
    success: true,
    message: `You've joined ${result.classDoc.name}.`,
    data: {
      class: { id: result.classDoc._id, name: result.classDoc.name },
      newConnectionCreated: result.newConnectionCreated,
    },
  });
});

const listMyJoinedClasses = asyncHandler(async (req, res) => {
  const classes = await classService.listClassesForStudent(req.user);
  res.status(200).json({ success: true, data: { classes } });
});

module.exports = { createClass, listMyClasses, getClassDetail, joinClass, listMyJoinedClasses };
