// src/services/emailService.js
//
// Transactional email service.
//
// Production: Amazon SES via the AWS SDK. Credentials come from the ECS task
// IAM role (no env vars, no SMTP creds). Sender is the verified SES identity
// (see EMAIL_FROM env var — must be verified in SES).
//
// Development: optional. If AWS_REGION is unset and no AWS creds are
// available, the service falls back to Nodemailer + Gmail SMTP for local
// testing using the legacy EMAIL_USER / EMAIL_PASS pair. This keeps the
// local Docker Compose flow working without requiring AWS access on every
// developer's machine.
//
// Function signatures are unchanged — controllers/seeders don't need updates.
// The team's existing non-blocking try/catch wrappers in
// productController.js and salesManagerController.js continue to work as-is.

require("dotenv").config();

const {
  SESv2Client,
  SendEmailCommand,
} = require("@aws-sdk/client-sesv2");

const SES_REGION = process.env.AWS_REGION || "eu-west-1";
const FROM_ADDRESS =
  process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@example.com";

// Decide whether to use SES (production / AWS environment) or Nodemailer
// (local dev fallback). We use SES whenever AWS_REGION is set OR we're in
// production, regardless of EMAIL_USER/PASS.
const useSes =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.AWS_REGION) ||
  Boolean(process.env.AWS_ACCESS_KEY_ID);

let sesClient = null;
let nodemailerTransporter = null;

if (useSes) {
  sesClient = new SESv2Client({ region: SES_REGION });
  console.log(`✅ SES client ready — region=${SES_REGION}, from=${FROM_ADDRESS}`);
} else {
  // Local dev fallback: Nodemailer + Gmail SMTP. The Nodemailer dependency
  // remains in package.json for this path.
  const nodemailer = require("nodemailer");
  nodemailerTransporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  nodemailerTransporter.verify((err) => {
    if (err) console.error("⚠️  SMTP verify failed (dev fallback):", err.message);
    else console.log("✅ SMTP ready (dev fallback)");
  });
}

/**
 * Send an invoice email with a PDF attachment.
 *
 * Note: SES SDK doesn't support raw attachments via SendEmailCommand's
 * "Simple" content type. For attachments we build a MIME message and send
 * it as "Raw" content. This keeps the same callsite contract as the previous
 * Nodemailer implementation.
 */
exports.sendInvoiceEmail = async (toEmail, subject, text, pdfContent) => {
  const finalSubject = subject ?? "Order Invoice";
  const finalText = text ?? "Your invoice is attached.";

  if (useSes) {
    // Build a multipart/mixed MIME message manually.
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const pdfBuffer = Buffer.isBuffer(pdfContent)
      ? pdfContent
      : await streamToBuffer(pdfContent);

    const rawMessage = [
      `From: ${FROM_ADDRESS}`,
      `To: ${toEmail}`,
      `Subject: ${finalSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      finalText,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="invoice.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="invoice.pdf"`,
      ``,
      pdfBuffer.toString("base64").replace(/(.{76})/g, "$1\r\n"),
      ``,
      `--${boundary}--`,
    ].join("\r\n");

    const command = new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      Destination: { ToAddresses: [toEmail] },
      Content: { Raw: { Data: Buffer.from(rawMessage) } },
    });

    const response = await sesClient.send(command);
    console.log("📧 SES invoice email sent →", response.MessageId);
    return response;
  }

  // Local dev fallback.
  const info = await nodemailerTransporter.sendMail({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: finalSubject,
    text: finalText,
    attachments: [{ filename: "invoice.pdf", content: pdfContent }],
  });
  console.log("📧 SMTP invoice email sent (dev) →", info.messageId);
  return info;
};

/**
 * Send a discount notification email (no attachments).
 */
exports.sendDiscountEmail = async (
  emails = [],
  productName,
  oldPrice,
  newPrice
) => {
  if (!Array.isArray(emails) || emails.length === 0) {
    console.log("📭 No recipients → discount email skipped.");
    return;
  }

  const subject = "Discount Alert – Your wishlist item is on sale!";
  const text = `Great news!

The product "${productName}" from your wishlist is now on discount.

Old Price: $${oldPrice}
New Price: $${newPrice}

Don't miss out on this deal!`;

  if (useSes) {
    const command = new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      Destination: { ToAddresses: emails },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Text: { Data: text } },
        },
      },
    });
    const response = await sesClient.send(command);
    console.log("📧 SES discount email sent →", response.MessageId);
    return response;
  }

  const info = await nodemailerTransporter.sendMail({
    from: FROM_ADDRESS,
    to: emails.join(", "),
    subject,
    text,
  });
  console.log("📧 SMTP discount email sent (dev) →", info.messageId);
  return info;
};

/**
 * Helper: consume a Node ReadableStream into a Buffer. PDFKit's output is
 * usually a Buffer in practice, but the callsite contract allows streams.
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
