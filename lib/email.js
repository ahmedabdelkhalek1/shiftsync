import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendPasswordResetEmail(to, username, resetUrl) {
    const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c8102e, #8b0000); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">ShiftSync</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Employee Schedule Manager</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #ffffff; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #aaa;">Hi <strong style="color: #fff;">${username}</strong>,</p>
        <p style="color: #aaa;">You requested a password reset. Click the button below to set a new password. This link expires in <strong style="color: #fff;">1 hour</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #c8102e, #8b0000); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 12px;">If you didn't request this, ignore this email. Your password won't change.</p>
        <p style="color: #444; font-size: 11px; margin-top: 24px; border-top: 1px solid #333; padding-top: 16px;">ShiftSync — Secure employee scheduling</p>
      </div>
    </div>
  `;

    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL DISABLED] Would send reset email to ${to}. Reset URL: ${resetUrl}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `ShiftSync <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset Your ShiftSync Password',
        html,
    });
}

export async function sendWelcomeEmail(to, username, password, appUrl) {
    const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c8102e, #8b0000); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">ShiftSync</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Employee Schedule Manager</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #ffffff; margin-top: 0;">Welcome to ShiftSync! 👋</h2>
        <p style="color: #aaa;">Your account has been created by your manager. Here are your login details:</p>
        <div style="background: #0f0f1a; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #333;">
          <p style="margin: 0 0 8px; color: #aaa; font-size: 13px;">Username</p>
          <p style="margin: 0 0 16px; color: #fff; font-size: 18px; font-weight: 700;">${username}</p>
          <p style="margin: 0 0 8px; color: #aaa; font-size: 13px;">Temporary Password</p>
          <p style="margin: 0; color: #c8102e; font-size: 18px; font-weight: 700; letter-spacing: 2px;">${password}</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${appUrl}/login" style="background: linear-gradient(135deg, #c8102e, #8b0000); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Login Now</a>
        </div>
        <p style="color: #e57373; font-size: 13px;">⚠️ Please change your password after your first login.</p>
      </div>
    </div>
  `;

    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL DISABLED] Would send welcome email to ${to}. Username: ${username}, Pass: ${password}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `ShiftSync <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Welcome to ShiftSync — Your Login Details',
        html,
    });
}
