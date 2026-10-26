import Course, { generateSlug } from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, formatPagination } from '../utils/response.js';

// Public: GET /api/courses
export const getPublicCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isPublished: true }).sort({ startDate: 1 });

  // Compute approved enrollments and seatsLeft for each course
  const coursesWithSeats = await Promise.all(
    courses.map(async (course) => {
      const approvedCount = await Enrollment.countDocuments({
        course: course._id,
        status: 'approved',
      });

      const seatsLeft = Math.max(0, course.seatsTotal - approvedCount);
      const isFull = seatsLeft <= 0;

      return {
        ...course.toJSON(),
        seatsLeft,
        isFull,
      };
    })
  );

  return sendSuccess(res, {
    data: coursesWithSeats,
  });
});

// Public: GET /api/courses/:slug
export const getPublicCourseBySlug = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    slug: req.params.slug.toLowerCase(),
    isPublished: true,
  });

  if (!course) {
    throw ApiError.notFound('Bootcamp course not found or is not currently published.', 'COURSE_NOT_FOUND');
  }

  const approvedCount = await Enrollment.countDocuments({
    course: course._id,
    status: 'approved',
  });

  const seatsLeft = Math.max(0, course.seatsTotal - approvedCount);
  const isFull = seatsLeft <= 0;

  return sendSuccess(res, {
    data: {
      ...course.toJSON(),
      seatsLeft,
      isFull,
    },
  });
});

// Admin: GET /api/admin/courses
export const getAdminCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', status } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tagline: { $regex: search, $options: 'i' } },
    ];
  }

  if (status === 'published') {
    query.isPublished = true;
  } else if (status === 'draft') {
    query.isPublished = false;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [courses, total] = await Promise.all([
    Course.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Course.countDocuments(query),
  ]);

  // Attach enrollment counts to each course for admin glance
  const items = await Promise.all(
    courses.map(async (c) => {
      const [approved, pending] = await Promise.all([
        Enrollment.countDocuments({ course: c._id, status: 'approved' }),
        Enrollment.countDocuments({ course: c._id, status: 'pending' }),
      ]);
      return {
        ...c.toJSON(),
        seatsLeft: Math.max(0, c.seatsTotal - approved),
        enrolledCount: approved,
        pendingCount: pending,
      };
    })
  );

  return sendSuccess(res, {
    data: formatPagination({ items, total, page: pageNum, limit: limitNum }),
  });
});

// Admin: POST /api/admin/courses
export const createCourse = asyncHandler(async (req, res) => {
  let baseSlug = generateSlug(req.body.title);
  let slug = baseSlug;
  let counter = 1;

  // Ensure unique slug
  while (await Course.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const course = await Course.create({
    ...req.body,
    slug,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: course,
    message: 'Course created successfully.',
  });
});

// Admin: GET /api/admin/courses/:id
export const getAdminCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound('Course not found.', 'COURSE_NOT_FOUND');
  }

  const [approvedCount, pendingCount] = await Promise.all([
    Enrollment.countDocuments({ course: course._id, status: 'approved' }),
    Enrollment.countDocuments({ course: course._id, status: 'pending' }),
  ]);

  return sendSuccess(res, {
    data: {
      ...course.toJSON(),
      seatsLeft: Math.max(0, course.seatsTotal - approvedCount),
      approvedCount,
      pendingCount,
    },
  });
});

// Admin: PUT /api/admin/courses/:id
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound('Course not found.', 'COURSE_NOT_FOUND');
  }

  // If title was updated and slug regeneration is requested/needed
  if (req.body.title && req.body.title !== course.title && req.body.updateSlug) {
    let baseSlug = generateSlug(req.body.title);
    let slug = baseSlug;
    let counter = 1;

    while (await Course.findOne({ slug, _id: { $ne: course._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    req.body.slug = slug;
  }

  Object.assign(course, req.body);
  await course.save();

  return sendSuccess(res, {
    data: course,
    message: 'Course updated successfully.',
  });
});

// Admin: DELETE /api/admin/courses/:id
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound('Course not found.', 'COURSE_NOT_FOUND');
  }

  // Non-negotiable rule: a course with enrollments cannot be deleted, only unpublished
  const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
  if (enrollmentCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete course with ${enrollmentCount} existing enrollments. Unpublish the course instead.`,
      'COURSE_HAS_ENROLLMENTS'
    );
  }

  await Course.findByIdAndDelete(course._id);

  return sendSuccess(res, {
    message: 'Course deleted successfully.',
  });
});

export default {
  getPublicCourses,
  getPublicCourseBySlug,
  getAdminCourses,
  createCourse,
  getAdminCourseById,
  updateCourse,
  deleteCourse,
};
