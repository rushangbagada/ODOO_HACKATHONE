import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getComplianceAlerts } from "@/lib/metrics";
import { sendLicenseReminderEmail } from "@/lib/mail";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FLEET_MANAGER" && user.role !== "SAFETY_OFFICER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { expiredLicenses, expiringSoon } = await getComplianceAlerts();

    if (expiredLicenses.length === 0 && expiringSoon.length === 0) {
      return NextResponse.json({ message: "No driver licenses need attention right now.", sent: false });
    }

    await sendLicenseReminderEmail(user.email, expiredLicenses, expiringSoon);

    return NextResponse.json({
      message: `Reminder email sent to ${user.email} covering ${expiredLicenses.length + expiringSoon.length} driver(s).`,
      sent: true,
    });
  } catch (error: any) {
    console.error("License reminder POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send license reminder email" },
      { status: 500 }
    );
  }
}
