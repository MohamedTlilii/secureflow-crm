const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // Gmail App Password
  }
});

const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: `"Alexx Sadd Sécurité" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
  return info;
};

const buildEmailHTML = (message, prospectName = '') => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="border-bottom: 3px solid #3b6cf8; padding-bottom: 20px; margin-bottom: 20px;">
    <h2 style="color: #3b6cf8; margin: 0;">Alexx Sadd Sécurité</h2>
    <p style="color: #666; margin: 5px 0; font-size: 13px;">Systèmes d'alarme · Incendie · Vol · Urgence médicale</p>
  </div>
  ${prospectName ? `<p>Bonjour ${prospectName},</p>` : ''}
  <div style="line-height: 1.7; font-size: 15px;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
    <p>Alexx Sadd — Expert en solutions de sécurité B2B & B2C</p>
    <p>Centrale certifiée ULC · Protection incendie, vol, urgence médicale</p>
  </div>
</body>
</html>`;

module.exports = { sendEmail, buildEmailHTML };
