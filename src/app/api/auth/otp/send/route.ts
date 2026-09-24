import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "@/services/otp.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { target, type = "PHONE" } = body;

    if (!target || typeof target !== "string") {
      return NextResponse.json(
        { success: false, error: "Target phone number or email is required." },
        { status: 400 }
      );
    }

    if (type !== "PHONE" && type !== "EMAIL") {
      return NextResponse.json(
        { success: false, error: "Invalid verification type. Must be PHONE or EMAIL." },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim().toLowerCase();
    const isTestTarget =
      cleanTarget.replace(/\D/g, "") === "1122334455" ||
      cleanTarget === "example@gmail.com" ||
      cleanTarget === "example@kiit.ac.in";

    // Rate Limiting: Max 5 OTP sends per 5 minutes per target, and max 15 per IP (bypassed for test account)
    if (!isTestTarget) {
      const targetLimit = checkRateLimit(`otp_send_target_${type}_${cleanTarget}`, {
        limit: 5,
        windowSeconds: 300,
      });

      if (!targetLimit.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many OTP requests. Please wait ${targetLimit.resetInSeconds} seconds before requesting a new code.`,
          },
          { status: 429, headers: { "Retry-After": String(targetLimit.resetInSeconds) } }
        );
      }

      const ipLimit = checkRateLimit(`otp_send_ip_${ip}`, {
        limit: 15,
        windowSeconds: 300,
      });

      if (!ipLimit.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many requests from this network. Please retry in ${ipLimit.resetInSeconds} seconds.`,
          },
          { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
        );
      }
    }

    const result = await OtpService.sendOtp(target, type);

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      data: result,
      message: result.message,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to dispatch verification OTP.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
