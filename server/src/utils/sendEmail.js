import nodemailer from 'nodemailer';

export async function sendVerificationEmail({ email, name, verificationLink }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Pharmacy Locator" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email',
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>Hello ${name}</h2>
        <p>Please verify your email by clicking below:</p>
        <a href="${verificationLink}" style="padding:10px 15px;background:#2563eb;color:white;text-decoration:none;border-radius:5px">
          Verify Email
        </a>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}