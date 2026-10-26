import mongoose from 'mongoose';

const rubricScoreSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const submissionHistorySchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
    },
    fileKey: {
      type: String,
      default: null,
    },
    link: {
      type: String,
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    marks: {
      type: Number,
      default: null,
    },
    finalMarks: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'submitted',
    },
  },
  { _id: true }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    fileKey: {
      type: String,
      default: null,
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded', 'returned'],
      default: 'submitted',
      index: true,
    },
    marks: {
      type: Number,
      default: null, // Raw score awarded before penalty
      min: 0,
    },
    latePenaltyApplied: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalMarks: {
      type: Number,
      default: null, // Marks after late penalty deduction
      min: 0,
    },
    rubricMarks: {
      type: [rubricScoreSchema],
      default: [],
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    history: {
      type: [submissionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One submission record per student per assignment (subsequent updates increment version and push to history)
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ course: 1, status: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
