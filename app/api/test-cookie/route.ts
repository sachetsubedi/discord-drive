import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const testCookie = cookieStore.get("test-cookie");

  console.log("Test cookie GET:", {
    hasCookie: !!testCookie,
    value: testCookie?.value,
    allCookies: Object.fromEntries(
      cookieStore.getAll().map((c) => [c.name, c.value])
    ),
  });

  return NextResponse.json({
    testCookie: testCookie?.value,
    allCookies: Object.fromEntries(
      cookieStore.getAll().map((c) => [c.name, c.value])
    ),
  });
}

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("test-cookie", "test-value", {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  console.log("Test cookie SET: test-value");

  return NextResponse.json({ success: true, message: "Cookie set" });
}
