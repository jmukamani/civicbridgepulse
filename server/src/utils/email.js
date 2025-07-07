import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Helper to determine if email is configured
const hasEmailConfig = () => {
  return (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
};

let transporter = null;
if (hasEmailConfig()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: true,
  });
  console.log("📧 SMTP enabled: emails will be sent");
} else {
  console.warn("📧 SMTP not configured – emails will be skipped");
}

export const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`Email skipped → would send to ${to} | ${subject}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}; 