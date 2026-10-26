import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [100, 'Resource title cannot exceed 100 characters'],
    },
    fileKey: {
      type: String,
      required: [true, 'Resource fileKey is required'],
      trim: true,
    },
  },
  { _id: true }
);

const sessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    week: {
      type: Number,
      required: [true, 'Week number is required'],
      min: [1, 'Week must be at least 1'],
    },
    order: {
      type: Number,
      required: [true, 'Order in week is required'],
      min: [1, 'Order must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled start time is required'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      default: 120,
      min: [15, 'Duration must be at least 15 minutes'],
      max: [360, 'Duration cannot exceed 360 minutes'],
    },
    meetingLink: {
      type: String,
      required: [true, 'Live meeting link is required'],
      trim: true,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
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

// Compound index on course and scheduledAt as required
sessionSchema.index({ course: 1, scheduledAt: 1 });
sessionSchema.index({ course: 1, week: 1, order: 1 });

export const Session = mongoose.model('Session', sessionSchema);
export default Session;
