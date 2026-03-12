import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

/**
 * Send an email using the ShiftSync Gmail account.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} htmlBody - HTML body content
 */
export async function sendEmail(to, subject, htmlBody) {
    if (!to || !to.includes('@')) {
        console.log(`[EMAIL SKIPPED] Invalid or missing recipient: "${to}"`);
        return;
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log(`[EMAIL DISABLED] GMAIL_USER or GMAIL_APP_PASSWORD not set. Would send "${subject}" to ${to}`);
        return;
    }

    await transporter.sendMail({
        from: `"ShiftSync" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html: htmlBody,
    });
}
