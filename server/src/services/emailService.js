import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD
    }
  });
}

export async function sendVerificationEmail({ email, name, verificationLink }) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASSWORD) {
    throw new Error('SMTP credentials are not configured');
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Pharmacy Locator" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Verify your Pharmacy Locator account',
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fbff;border:1px solid #dbeafe;border-radius:20px;color:#12324a;">
        <h2 style="margin-top:0;color:#2563eb;">Verify your account</h2>
        <p>Hello ${name},</p>
        <p>Thanks for signing up for Pharmacy Locator. Click the button below to verify your email address.</p>
        <p style="margin:24px 0;">
          <a href="${verificationLink}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;">
            Verify Account
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;color:#1d4ed8;">${verificationLink}</p>
      </div>
    `
  });
}
