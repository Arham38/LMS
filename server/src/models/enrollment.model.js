import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled'],
        message: 'Invalid enrollment status',
      },
      default: 'pending',
      index: true,
    },
    amountDue: {
      type: Number,
      required: [true, 'Amount due is required'],
      min: [0, 'Amount due cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'bank', 'other'],
      required: [true, 'Payment method is required'],
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID / Reference number is required'],
      trim: true,
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    senderNumber: {
      type: String,
      required: [true, 'Sender account / mobile number is required'],
      trim: true,
    },
    paymentNote: {
      type: String,
      trim: true,
      default: '',
    },
    paymentProofKey: {
      type: String,
      trim: true,
      default: null,
    },
    paymentProofName: {
      type: String,
      trim: true,
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active enrollments for the same student in the same course.
// A student can only have ONE 'pending' or 'approved' enrollment per course at a time.
enrollmentSchema.index(
  { student: 1, course: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
  }
);

// Compound index for admin filtering
enrollmentSchema.index({ status: 1, createdAt: -1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
