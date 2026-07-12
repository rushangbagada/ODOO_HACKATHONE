import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset. Click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">If the button doesn't work, copy and paste this link: <br /> ${resetUrl}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset email");
  }
}

interface LicenseAlertDriver {
  name: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
}

export async function sendLicenseReminderEmail(
  toEmail: string,
  expired: LicenseAlertDriver[],
  expiringSoon: LicenseAlertDriver[]
) {
  const row = (d: LicenseAlertDriver, color: string) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.licenseNumber}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${color}; font-weight: 600;">
        ${new Date(d.licenseExpiryDate).toLocaleDateString()}
      </td>
    </tr>`;

  const section = (title: string, drivers: LicenseAlertDriver[], color: string) =>
    drivers.length === 0
      ? ""
      : `
      <h3 style="color: ${color}; margin-top: 24px;">${title} (${drivers.length})</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f4f4f5; text-align: left;">
            <th style="padding: 8px;">Driver</th>
            <th style="padding: 8px;">License Number</th>
            <th style="padding: 8px;">Expiry Date</th>
          </tr>
        </thead>
        <tbody>${drivers.map((d) => row(d, color)).join("")}</tbody>
      </table>`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `TransitOps: ${expired.length + expiringSoon.length} driver license(s) need attention`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Driver License Compliance Report</h2>
        <p>The following drivers have licenses that are expired or expiring within 30 days.</p>
        ${section("Expired Licenses", expired, "#dc2626")}
        ${section("Expiring Within 30 Days", expiringSoon, "#d97706")}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Sent from TransitOps compliance monitoring.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending license reminder email:", error);
    throw new Error("Failed to send license reminder email");
  }
}
