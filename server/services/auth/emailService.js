const nodemailer = require('nodemailer');
const { env } = require('../../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    // eslint-disable-next-line no-console
    console.warn(
      'SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). ' +
        'Verification emails will be logged to the console instead of sent.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
}

async function sendVerificationEmail(toEmail, name, verificationUrl) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#2563eb;">Welcome to EduMap, ${name}!</h2>
      <p>Please verify your email address to activate your account.</p>
      <p>
        <a href="${verificationUrl}"
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                  text-decoration:none;border-radius:8px;">
          Verify my email
        </a>
      </p>
      <p>Or copy this link into your browser:<br/>${verificationUrl}</p>
      <p style="color:#888;font-size:12px;">This link expires in 24 hours. If you didn't create an EduMap account, you can ignore this email.</p>
    </div>
  `;

  const t = getTransporter();

  if (!t) {
    // Development fallback: no crash, no fake "success" — just make the
    // link visible so the flow can still be tested end to end.
    // eslint-disable-next-line no-console
    console.log(`[DEV EMAIL FALLBACK] Verification link for ${toEmail}: ${verificationUrl}`);
    return { delivered: false, devFallback: true };
  }

  await t.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: 'Verify your EduMap account',
    html,
  });

  return { delivered: true, devFallback: false };
}

module.exports = { sendVerificationEmail };
