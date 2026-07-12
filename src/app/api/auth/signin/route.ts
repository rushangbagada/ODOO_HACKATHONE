import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signinSchema } from "@/lib/validations";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = signinSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(validatedData.password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status === "PENDING") {
      return NextResponse.json(
        { error: "Your account is pending approval. Please wait for an admin to review your request." },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        { error: "Your account has been rejected. Reason: " + (user.rejectionReason || "No reason provided") },
        { status: 403 }
      );
    }

    await login(user);

    return NextResponse.json(
      { message: "Logged in successfully", user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Signin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
