import Settings from '../models/settings.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// Public: GET /api/settings/public
export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  return sendSuccess(res, {
    data: {
      paymentMethods: settings.paymentMethods,
      whatsappNumber: settings.whatsappNumber,
      supportEmail: settings.supportEmail,
      address: settings.address,
      socialLinks: settings.socialLinks,
    },
  });
});

// Admin: GET /api/admin/settings
export const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  return sendSuccess(res, {
    data: settings,
  });
});

// Admin: PUT /api/admin/settings
export const updateAdminSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings(req.body);
  } else {
    Object.assign(settings, req.body);
  }

  await settings.save();

  return sendSuccess(res, {
    data: settings,
    message: 'Settings updated successfully.',
  });
});

export default {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
};
