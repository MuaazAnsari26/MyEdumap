const fs = require('fs');
const path = require('path');
const Resource = require('../../models/Resource');
const Subject = require('../../models/Subject');
const Chapter = require('../../models/Chapter');
const AppError = require('../../utils/AppError');

async function listResourcesForStudent(grade, { subjectId, chapterId } = {}) {
  const filter = { grade };
  if (subjectId) filter.subject = subjectId;
  if (chapterId) filter.chapter = chapterId;

  return Resource.find(filter)
    .populate('subject', 'name')
    .populate('chapter', 'name')
    .sort({ createdAt: -1 })
    .lean();
}

async function listResourcesForTeacher(teacherUserId) {
  return Resource.find({ uploadedBy: teacherUserId })
    .populate('subject', 'name grade')
    .populate('chapter', 'name')
    .sort({ createdAt: -1 })
    .lean();
}

async function createResource(teacherUser, payload, file) {
  const { grade, subjectId, chapterId, type, title, description, externalUrl } = payload;

  const subject = await Subject.findOne({ _id: subjectId, grade });
  if (!subject) {
    throw new AppError('That subject does not belong to the selected grade.', 400, 'INVALID_SUBJECT');
  }

  let chapter = null;
  if (chapterId) {
    chapter = await Chapter.findOne({ _id: chapterId, subject: subjectId });
    if (!chapter) {
      throw new AppError('That chapter does not belong to the selected subject.', 400, 'INVALID_CHAPTER');
    }
  }

  const isFileType = ['pdf', 'document', 'notes', 'assignment'].includes(type);

  if (isFileType && !file) {
    throw new AppError('Please attach a file for this resource type.', 400, 'FILE_REQUIRED');
  }

  if (!isFileType && !externalUrl) {
    throw new AppError('Please provide a link for this resource type.', 400, 'LINK_REQUIRED');
  }

  const resource = await Resource.create({
    grade,
    subject: subjectId,
    chapter: chapterId || null,
    type,
    title,
    description,
    fileUrl: isFileType && file ? `/uploads/resources/${file.filename}` : null,
    fileOriginalName: isFileType && file ? file.originalname : null,
    externalUrl: !isFileType ? externalUrl : null,
    uploadedBy: teacherUser._id,
  });

  return resource;
}

async function deleteResource(teacherUser, resourceId) {
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
  }

  if (!resource.uploadedBy.equals(teacherUser._id)) {
    throw new AppError('You can only remove resources you uploaded.', 403, 'FORBIDDEN');
  }

  if (resource.fileUrl) {
    const absolutePath = path.join(__dirname, '..', '..', resource.fileUrl.replace(/^\/uploads\//, 'uploads/'));
    fs.unlink(absolutePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        // eslint-disable-next-line no-console
        console.error('Failed to delete resource file from disk:', err.message);
      }
    });
  }

  await resource.deleteOne();
  return resource;
}

module.exports = { listResourcesForStudent, listResourcesForTeacher, createResource, deleteResource };
