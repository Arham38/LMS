import env from '../config/env.js';

export const sendPasswordResetEmail = async ({ email, resetToken, name }) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  // In development and test modes, log the reset link to the console
  if (env.NODE_ENV !== 'production') {
    console.log('\n================== [DEV EMAIL SERVICE] ==================');
    console.log(`To: ${name ? `${name} <${email}>` : email}`);
    console.log('Subject: Password Reset Request — CodeCraft Academy');
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('This single-use link expires in 30 minutes.');
    console.log('=========================================================\n');
  }

  // When SMTP / Resend / AWS SES is configured in production, plug provider here:
  // e.g. await mailer.sendMail({ to: email, subject: '...', html: '...' });

  return {
    success: true,
    recipient: email,
    resetUrl,
  };
};

export default {
  sendPasswordResetEmail,
};
