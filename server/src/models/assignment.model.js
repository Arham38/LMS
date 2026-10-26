import mongoose from 'mongoose';

const rubricItemSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: [true, 'Rubric criterion description is required'],
      trim: true,
      maxlength: [120, 'Criterion cannot exceed 120 characters'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Criterion max marks is required'],
      min: [1, 'Criterion marks must be at least 1'],
    },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    week: {
      type: Number,
      required: [true, 'Curriculum week number is required'],
      min: [1, 'Week must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true,
    },
    attachmentKey: {
      type: String,
      trim: true,
      default: null,
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      default: 100,
      min: [1, 'Maximum marks must be at least 1'],
    },
    submissionType: {
      type: String,
      enum: ['file', 'link', 'either'],
      default: 'either',
    },
    allowLate: {
      type: Boolean,
      default: true,
    },
    latePenaltyPercent: {
      type: Number,
      default: 10,
      min: [0, 'Late penalty percentage cannot be negative'],
      max: [100, 'Late penalty percentage cannot exceed 100'],
    },
    allowResubmit: {
      type: Boolean,
      default: false,
    },
    rubric: {
      type: [rubricItemSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ course: 1, week: 1 });
assignmentSchema.index({ course: 1, dueAt: 1 });
assignmentSchema.index({ course: 1, isPublished: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
