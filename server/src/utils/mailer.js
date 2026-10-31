import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    transporter._from = SMTP_FROM || SMTP_USER;
  } else {
    // Dev fallback: no real SMTP configured — log mail instead of sending.
    transporter = {
      _from: 'no-reply@subscriptions.local',
      async sendMail(opts) {
        console.log('[mailer:dev-fallback] To:', opts.to, '| Subject:', opts.subject);
        if (opts.text) console.log(opts.text);
        return { messageId: 'dev-fallback' };
      }
    };
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html, attachments }) {
  const t = getTransporter();
  return t.sendMail({ from: t._from, to, subject, text, html, attachments });
}
