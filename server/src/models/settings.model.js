import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'bank', 'other'],
      required: true,
    },
    accountTitle: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const settingsSchema = new mongoose.Schema(
  {
    paymentMethods: {
      type: [paymentMethodSchema],
      default: [
        {
          type: 'jazzcash',
          accountTitle: 'CodeCraft Academy Admissions',
          accountNumber: '03001234567',
          instructions: 'Send tuition fee via JazzCash mobile account. Note the 12-digit TID from SMS.',
        },
        {
          type: 'easypaisa',
          accountTitle: 'CodeCraft Academy Admissions',
          accountNumber: '03001234567',
          instructions: 'Transfer fee via Easypaisa app or retailer. Keep the receipt screenshot.',
        },
        {
          type: 'bank',
          accountTitle: 'CodeCraft Academy Private Limited',
          accountNumber: '0101010101234567 (Meezan Bank - Gulberg Branch, Lahore)',
          instructions: 'Transfer via online IBFT. Enter your mobile number in the payment remarks/description.',
        },
      ],
    },
    whatsappNumber: {
      type: String,
      default: '+92 300 1234567',
    },
    supportEmail: {
      type: String,
      default: 'admissions@codecraft.academy',
    },
    address: {
      type: String,
      default: 'Gulberg III, Lahore, Pakistan',
    },
    socialLinks: {
      github: { type: String, default: 'https://github.com' },
      linkedin: { type: String, default: 'https://linkedin.com' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get the singleton settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
