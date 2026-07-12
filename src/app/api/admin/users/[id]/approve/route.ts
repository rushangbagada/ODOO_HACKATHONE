import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Fleet Managers can approve users
    if (user.role !== "FLEET_MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.status !== "PENDING") {
      return NextResponse.json(
        { error: `User is already ${targetUser.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const approved = await prisma.user.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: user.id,
      },
    });

    return NextResponse.json({ user: approved });
  } catch (error) {
    console.error("Approve user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
