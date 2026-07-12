import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET || "default_secret_key_change_me";
const key = new TextEncoder().encode(secretKey);

export const TOKEN_NAME = "auth_token";

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(user: { id: string; email: string; role: string; name: string | null }) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ 
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    expires 
  });

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, "", { expires: new Date(0), path: "/" });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(TOKEN_NAME)?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (err) {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(TOKEN_NAME)?.value;
  if (!session) return null;

  try {
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
      name: TOKEN_NAME,
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    return res;
  } catch (e) {
    return null;
  }
}

// Utility functions for role checking
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function checkRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function getAuthenticatedUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}
