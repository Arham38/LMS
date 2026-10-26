import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'enrollment_approved',
        'enrollment_rejected',
        'session_scheduled',
        'session_rescheduled',
        'session_cancelled',
        'assignment_graded',
        'assignment_returned',
        'assignment_published',
        'quiz_published',
        'announcement_created',
        'general',
      ],
      default: 'general',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [180, 'Notification title cannot exceed 180 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true,
    },
    link: {
      type: String,
      default: '',
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast unread queries and sorted user inboxes
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
