/**
 * ShiftSync Email Templates
 * All templates are mobile-friendly, professional HTML emails
 * with ShiftSync branding (dark theme, red gradient header).
 */

const APP_URL = 'https://shiftsync-six.vercel.app/';

const header = `
  <div style="background: linear-gradient(135deg, #c8102e, #8b0000); padding: 32px; text-align: center;">
    <h1 style="margin: 0; color: white; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ShiftSync</h1>
    <p style="margin: 6px 0 0; color: rgba(255,255,255,0.75); font-size: 13px;">Employee Schedule Manager</p>
  </div>
`;

const footer = `
  <div style="padding: 20px 32px; text-align: center; border-top: 1px solid #2a2a3d;">
    <p style="margin: 0; color: #555; font-size: 11px;">ShiftSync &mdash; Secure Employee Scheduling &bull; <a href="${APP_URL}" style="color: #c8102e; text-decoration: none;">shiftsync-six.vercel.app</a></p>
  </div>
`;

const wrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ShiftSync</title>
</head>
<body style="margin: 0; padding: 0; background: #0d0d1a; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width: 520px; margin: 32px auto; background: #1a1a2e; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
    ${header}
    <div style="padding: 32px;">
      ${content}
    </div>
    ${footer}
  </div>
</body>
</html>
`;

const loginButton = (label = 'Log In to ShiftSync') => `
  <div style="text-align: center; margin: 28px 0;">
    <a href="${APP_URL}" style="background: linear-gradient(135deg, #c8102e, #8b0000); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; letter-spacing: 0.3px;">${label}</a>
  </div>
`;

// ─────────────────────────────────────────────
// FEATURE 2 — Welcome Email (new user created)
// ─────────────────────────────────────────────
export function welcomeEmailTemplate(fullName, loginUsername, tempPassword) {
    return wrapper(`
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Welcome to ShiftSync! 🎉</h2>
    <p style="color: #aaa; line-height: 1.6;">Hi <strong style="color: #fff;">${fullName}</strong>,</p>
    <p style="color: #aaa; line-height: 1.6;">Your account has been created successfully. You can now log in using the credentials below.</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 22px; margin: 24px 0; border: 1px solid #2a2a3d;">
      <p style="margin: 0 0 6px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Login Username</p>
      <p style="margin: 0 0 20px; color: #fff; font-size: 17px; font-weight: 700;">${loginUsername}</p>

      <p style="margin: 0 0 6px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
      <p style="margin: 0; color: #c8102e; font-size: 20px; font-weight: 800; letter-spacing: 3px;">${tempPassword}</p>
    </div>

    ${loginButton('Log In Now')}

    <p style="color: #e57373; font-size: 13px; text-align: center; margin-top: 0;">
      ⚠️ Please change your password after your first login.
    </p>
    <p style="color: #555; font-size: 12px; text-align: center;">
      If you did not expect this email, please contact your manager.
    </p>
  `);
}

// ────────────────────────────────────────────────────────────
// FEATURE 3 — New Monthly Schedule Published
// ────────────────────────────────────────────────────────────
export function schedulePublishedTemplate(managerName, month, year) {
    return wrapper(`
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">📅 New Schedule Published</h2>
    <p style="color: #aaa; line-height: 1.6;">Your manager <strong style="color: #fff;">${managerName}</strong> has published the schedule for:</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 22px; margin: 24px 0; border: 1px solid #2a2a3d; text-align: center;">
      <p style="margin: 0; color: #c8102e; font-size: 28px; font-weight: 800;">${month} ${year}</p>
      <p style="margin: 8px 0 0; color: #888; font-size: 13px;">Log in to view your full shift schedule for this period.</p>
    </div>

    ${loginButton('View My Schedule')}

    <p style="color: #555; font-size: 12px; text-align: center;">
      If you have questions about your schedule, please contact your manager directly.
    </p>
  `);
}

// ────────────────────────────────────────────────────────────
// FEATURE 4A — Change Request Submitted (to manager)
// ────────────────────────────────────────────────────────────
export function changeRequestToManagerTemplate(employeeName, date, currentShift, requestedShift, reason) {
    const reasonRow = reason
        ? `<tr><td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #2a2a3d; width: 40%;">Reason</td><td style="padding: 10px 0; color: #fff; font-size: 13px; border-bottom: 1px solid #2a2a3d;">${reason}</td></tr>`
        : '';
    return wrapper(`
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">🔄 New Schedule Change Request</h2>
    <p style="color: #aaa; line-height: 1.6;">An employee has submitted a schedule change request that requires your review.</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 22px; margin: 24px 0; border: 1px solid #2a2a3d;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #2a2a3d; width: 40%;">Employee</td>
          <td style="padding: 10px 0; color: #fff; font-size: 13px; font-weight: 700; border-bottom: 1px solid #2a2a3d;">${employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #2a2a3d;">Date</td>
          <td style="padding: 10px 0; color: #fff; font-size: 13px; border-bottom: 1px solid #2a2a3d;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #2a2a3d;">Current Shift</td>
          <td style="padding: 10px 0; color: #fff; font-size: 13px; border-bottom: 1px solid #2a2a3d; text-transform: capitalize;">${currentShift}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #888; font-size: 13px; ${reason ? 'border-bottom: 1px solid #2a2a3d;' : ''}">Requested Change</td>
          <td style="padding: 10px 0; color: #c8102e; font-size: 13px; font-weight: 700; ${reason ? 'border-bottom: 1px solid #2a2a3d;' : ''} text-transform: capitalize;">${requestedShift}</td>
        </tr>
        ${reasonRow}
      </table>
    </div>

    ${loginButton('Review Request in ShiftSync')}

    <p style="color: #555; font-size: 12px; text-align: center;">
      Log in to approve or reject this request from the Approvals Inbox.
    </p>
  `);
}

// ────────────────────────────────────────────────────────────
// FEATURE 4B — Change Request APPROVED (to employee)
// ────────────────────────────────────────────────────────────
export function changeRequestApprovedTemplate(employeeName, date, newShift) {
    return wrapper(`
    <h2 style="color: #4caf50; margin-top: 0; font-size: 20px;">✅ Schedule Change Approved</h2>
    <p style="color: #aaa; line-height: 1.6;">Hi <strong style="color: #fff;">${employeeName}</strong>,</p>
    <p style="color: #aaa; line-height: 1.6;">Great news! Your schedule change request has been <strong style="color: #4caf50;">approved</strong> by your manager.</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 22px; margin: 24px 0; border: 1px solid #2a2a3d;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #2a2a3d; width: 40%;">Date</td>
          <td style="padding: 10px 0; color: #fff; font-size: 13px; border-bottom: 1px solid #2a2a3d;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #888; font-size: 13px;">New Shift</td>
          <td style="padding: 10px 0; color: #4caf50; font-size: 14px; font-weight: 700; text-transform: capitalize;">${newShift}</td>
        </tr>
      </table>
    </div>

    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">Your schedule has been updated. Log in to view the latest version.</p>

    ${loginButton('View My Schedule')}
  `);
}

// ────────────────────────────────────────────────────────────
// FEATURE 4B — Change Request REJECTED (to employee)
// ────────────────────────────────────────────────────────────
export function changeRequestRejectedTemplate(employeeName) {
    return wrapper(`
    <h2 style="color: #e57373; margin-top: 0; font-size: 20px;">❌ Schedule Change Not Approved</h2>
    <p style="color: #aaa; line-height: 1.6;">Hi <strong style="color: #fff;">${employeeName}</strong>,</p>
    <p style="color: #aaa; line-height: 1.6;">We regret to let you know that your recent schedule change request was <strong style="color: #e57373;">not approved</strong> by your manager at this time.</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 20px; margin: 24px 0; border: 1px solid #2a2a3d;">
      <p style="margin: 0; color: #888; font-size: 13px; line-height: 1.7;">If you have questions about this decision, please reach out to your manager directly. They will be happy to explain the reasoning and discuss alternative arrangements.</p>
    </div>

    ${loginButton('View My Requests')}

    <p style="color: #555; font-size: 12px; text-align: center;">
      You can submit a new request at any time from the ShiftSync portal.
    </p>
  `);
}

// ────────────────────────────────────────────────────────────
// FEATURE 5 — Schedule Updated Notification (to employee)
// ────────────────────────────────────────────────────────────
export function scheduleUpdatedTemplate(managerName) {
    return wrapper(`
    <h2 style="color: #ffb300; margin-top: 0; font-size: 20px;">⚠️ Your Schedule Has Been Updated</h2>
    <p style="color: #aaa; line-height: 1.6;">Your manager <strong style="color: #fff;">${managerName}</strong> has made a change to your current schedule.</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 20px; margin: 24px 0; border: 1px solid #2a2a3d;">
      <p style="margin: 0; color: #888; font-size: 13px; line-height: 1.7;">Please log in to ShiftSync to review the latest version of your schedule. If you believe this change was made in error, contact your manager.</p>
    </div>

    ${loginButton('Review My Schedule')}
  `);
}

// ────────────────────────────────────────────────────────────
// FEATURE 6 — Custom Manager Announcement
// ────────────────────────────────────────────────────────────
export function managerAnnouncementTemplate(managerName, subjectTitle, customMessage) {
    // Convert newlines to HTML paragraphs
    const formattedMessage = customMessage
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => `<p style="margin: 0 0 10px 0; line-height: 1.6;">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
        .join('');

    return wrapper(`
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">${subjectTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
    <p style="color: #aaa; margin-bottom: 24px; font-style: italic; font-size: 14px;">An announcement from your manager, <strong style="color: #fff; font-style: normal;">${managerName}</strong>:</p>

    <div style="background: #0f0f1a; border-radius: 10px; padding: 24px; margin: 24px 0; border: 1px solid #2a2a3d; color: #ddd; font-size: 15px;">
      ${formattedMessage}
    </div>

    ${loginButton('Open ShiftSync')}
  `);
}
