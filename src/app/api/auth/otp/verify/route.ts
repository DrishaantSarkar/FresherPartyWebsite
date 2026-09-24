import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "@/services/otp.service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, type = "PHONE", code, verificationId } = body || {};
    const cleanTarget = target ? String(target).trim().toLowerCase() : "";
    const cleanCode = code ? String(code).trim().replace(/\D/g, "") : "";
    const isTestTarget =
      cleanTarget.replace(/\D/g, "") === "1122334455" ||
      cleanTarget === "example@gmail.com" ||
      cleanTarget === "example@kiit.ac.in";

    if (!cleanTarget || !cleanCode || (!verificationId && !isTestTarget)) {
      return NextResponse.json(
        { success: false, error: "Target and a valid 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    if (type !== "PHONE" && type !== "EMAIL") {
      return NextResponse.json(
        { success: false, error: "Invalid verification type. Must be PHONE or EMAIL." },
        { status: 400 }
      );
    }

    // Rate Limiting: Max 6 verify attempts per 10 minutes per target (bypassed for test account)
    if (!isTestTarget) {
      const verifyLimit = checkRateLimit(`otp_verify_${type}_${cleanTarget}`, {
        limit: 6,
        windowSeconds: 600,
      });

      if (!verifyLimit.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many failed attempts. For security, please request a new verification OTP.",
          },
          { status: 429, headers: { "Retry-After": String(verifyLimit.resetInSeconds) } }
        );
      }
    }

    const result = OtpService.verifyOtp(cleanTarget, type, cleanCode, verificationId || "test-session");

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      message: result.message,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to verify OTP code.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
