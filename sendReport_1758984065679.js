// Create server/sendReport.js
// Simple Express serverless handler to accept a base64 PDF and email via SendGrid.
// Usage: Set SENDGRID_API_KEY and FROM_EMAIL environment variables.

const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 4000;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';

if (!SENDGRID_API_KEY) {
  console.warn('Warning: SENDGRID_API_KEY not set. Email sending will fail until configured.');
}

app.post('/send-report', async (req, res) => {
  try {
    const { to, subject, body, filename, pdfBase64 } = req.body;
    if (!to || !pdfBase64) return res.status(400).json({ success: false, message: 'to and pdfBase64 are required' });

    // Use SendGrid to send mail with attachment
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY);

    const msg = {
      to,
      from: FROM_EMAIL,
      subject: subject || 'BEMACHO Crackers Report',
      text: body || 'Please find attached the report.',
      attachments: [
        {
          content: pdfBase64,
          filename: filename || 'report.pdf',
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    };

    await sgMail.send(msg);
    return res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error('send-report error', err);
    return res.status(500).json({ success: false, message: String(err) });
  }
});

app.listen(PORT, () => console.log(`SendReport server listening on ${PORT}`));

// Note: deploy this as a small server or serverless function. Provide SENDGRID_API_KEY and FROM_EMAIL as env vars.