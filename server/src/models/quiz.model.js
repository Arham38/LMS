import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['single', 'multiple', 'true_false'],
      default: 'single',
    },
    options: {
      type: [String],
      required: [true, 'At least two options are required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 2;
        },
        message: 'A question must provide at least 2 options',
      },
    },
    correctIndexes: {
      type: [Number],
      required: [true, 'At least one correct answer index is required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 1;
        },
        message: 'At least one correct index is required',
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    marks: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Marks must be at least 1'],
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
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
      required: [true, 'Week number is required'],
      min: [1, 'Week must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [2, 'Quiz title must be at least 2 characters'],
      maxlength: [140, 'Quiz title cannot exceed 140 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    timeLimitMinutes: {
      type: Number,
      default: null, // null or 0 means untimed
      min: [0, 'Time limit cannot be negative'],
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Maximum attempts must be at least 1'],
      max: [10, 'Maximum attempts cannot exceed 10'],
    },
    opensAt: {
      type: Date,
      default: null,
    },
    closesAt: {
      type: Date,
      default: null,
    },
    passingPercent: {
      type: Number,
      required: true,
      default: 60,
      min: [0, 'Passing percentage must be at least 0'],
      max: [100, 'Passing percentage cannot exceed 100'],
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showAnswers: {
      type: String,
      enum: ['immediately', 'after_close', 'never'],
      default: 'immediately',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ course: 1, week: 1 });
quizSchema.index({ course: 1, isPublished: 1 });

export const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
