import mongoose from 'mongoose';

const syllabusModuleSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    topics: {
      type: [String],
      default: [],
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [120, 'Course title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      required: [true, 'Course tagline is required'],
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    durationWeeks: {
      type: Number,
      required: [true, 'Duration in weeks is required'],
      min: [1, 'Duration must be at least 1 week'],
      max: [52, 'Duration cannot exceed 52 weeks'],
    },
    schedule: {
      type: String,
      required: [true, 'Schedule description is required'],
      trim: true,
      // e.g. 'Tue & Thu 8:00 PM - 10:00 PM PKT'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    seatsTotal: {
      type: Number,
      required: [true, 'Total seats count is required'],
      min: [1, 'Seats total must be at least 1'],
      max: [500, 'Seats cannot exceed 500'],
    },
    fee: {
      type: Number,
      required: [true, 'Course tuition fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    installmentsAllowed: {
      type: Boolean,
      default: false,
    },
    installmentPlan: {
      type: String,
      trim: true,
      default: '',
    },
    syllabus: {
      type: [syllabusModuleSchema],
      default: [],
    },
    outcomes: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEnrollmentOpen: {
      type: Boolean,
      default: true,
    },
    gradeWeights: {
      attendance: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      quizzes: {
        type: Number,
        default: 40,
        min: 0,
        max: 100,
      },
      assignments: {
        type: Number,
        default: 40,
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Slugify helper
export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Compound index for published courses query
courseSchema.index({ isPublished: 1, isEnrollmentOpen: 1 });

export const Course = mongoose.model('Course', courseSchema);
export default Course;
