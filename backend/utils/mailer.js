const nodemailer = require('nodemailer');

const sendOTP = async (toEmail, name, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Gmail App Password (bukan password biasa)
    }
  });
  const mailOptions = {
    from: `"Warungku" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Kode Verifikasi Akun Warungku',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 4px;">🛍️ Warungku</h2>
        <p style="color: #6b7280; font-size: 14px;">Verifikasi Email</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
        <p style="color: #111827;">Halo <strong>${name}</strong>,</p>
        <p style="color: #374151;">Gunakan kode OTP berikut untuk memverifikasi akun Anda:</p>
        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #059669;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Kode berlaku selama <strong>10 menit</strong>.</p>
        <p style="color: #6b7280; font-size: 13px;">Jika Anda tidak mendaftar, abaikan email ini.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
