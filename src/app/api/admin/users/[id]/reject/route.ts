import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason required"),
});

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

    // Only Fleet Managers can reject users
    if (user.role !== "FLEET_MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

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

    const rejected = await prisma.user.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        approvedBy: user.id,
      },
    });

    return NextResponse.json({ user: rejected });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Reject user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
