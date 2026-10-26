import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session reference is required'],
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto',
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      default: 'present',
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one attendance record per student per session
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceSchema.index({ course: 1, student: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
