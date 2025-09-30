import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

// POST /api/export/email
router.post("/api/export/email", async (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64 || !filename) {
      console.error("Missing PDF or filename", { pdfBase64Length: pdfBase64?.length, filename });
      return res.status(400).json({ error: "Missing PDF or filename" });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    console.log(`Received PDF for email export: filename=${filename}, size=${pdfBuffer.length} bytes`);
    if (pdfBuffer.length < 1000) {
      console.error("PDF buffer too small, likely invalid PDF", { size: pdfBuffer.length });
      return res.status(400).json({ error: "PDF data too small or invalid" });
    }

    // Configure transporter (replace with real SMTP credentials)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "bntalasha@gmail.com",
        pass: "rewu owtj xbkt qyay"
      }
    });

    try {
      await transporter.sendMail({
        from: 'no-reply@crackerbase.com',
        to: 'bntalasha@gmail.com',
        subject: 'Crackerbase Report PDF',
        text: 'Attached is your exported PDF report.',
        attachments: [
          {
            filename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      console.log("Email sent successfully");
      res.json({ success: true });
    } catch (emailErr) {
      console.error("Nodemailer sendMail error:", emailErr);
      res.status(500).json({ error: "Failed to send email", details: emailErr?.toString() });
    }
  } catch (error) {
    console.error("Email export failed:", error);
    res.status(500).json({ error: "Failed to send email", details: error?.toString() });
  }
});

export default router;
