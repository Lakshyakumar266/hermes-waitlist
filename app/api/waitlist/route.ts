import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const sql    = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // ── Save to Postgres ──────────────────────────────────────────────────────
    try {
      await sql`
        INSERT INTO waitlist (name, email)
        VALUES (${name.trim()}, ${email.trim().toLowerCase()})
      `;
    } catch (dbErr: unknown) {
      // Unique constraint = already on waitlist
      const err = dbErr as { code?: string };
      if (err.code === "23505") {
        return NextResponse.json({ error: "You're already on the waitlist." }, { status: 409 });
      }
      throw dbErr;
    }

    // ── Email to Hermes team ──────────────────────────────────────────────────
    await resend.emails.send({
      from:    "onboarding@resend.dev", // change once you verify your domain
      to:      "lakshya@hermesworkspace.com",
      subject: `New waitlist signup — ${name}`,
      html: `
        <div style="font-family:monospace;background:#090909;color:#e8e8e8;padding:32px;border-radius:8px;">
          <h2 style="margin:0 0 16px;color:#ffffff;">New Waitlist Signup</h2>
          <table style="border-collapse:collapse;width:100%;">
            <tr>
              <td style="padding:8px 16px 8px 0;color:#888;width:80px;">Name</td>
              <td style="padding:8px 0;color:#e8e8e8;">${name.trim()}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px 8px 0;color:#888;">Email</td>
              <td style="padding:8px 0;color:#e8e8e8;">${email.trim().toLowerCase()}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px 8px 0;color:#888;">Time</td>
              <td style="padding:8px 0;color:#e8e8e8;">${new Date().toUTCString()}</td>
            </tr>
          </table>
        </div>
      `,
    });

    // ── Confirmation email to the user ────────────────────────────────────────
    await resend.emails.send({
      from:    "onboarding@resend.dev",
      to:      email.trim().toLowerCase(),
      subject: "You're on the Hermes Workspace waitlist",
      html: `
        <div style="font-family:monospace;background:#090909;color:#e8e8e8;padding:40px;max-width:480px;margin:0 auto;border-radius:8px;">
          <div style="margin-bottom:32px;">
            <div style="width:36px;height:36px;background:#ffffff;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
              <span style="font-size:18px;">⚡</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;letter-spacing:-0.02em;">Signal received.</h1>
            <p style="margin:0;color:#888;font-size:14px;line-height:1.6;">
              Hey ${name.trim().split(" ")[0]}, you're on the waitlist for Hermes Workspace.
            </p>
          </div>

          <p style="color:#aaa;font-size:14px;line-height:1.75;margin:0 0 24px;">
            We're building an all-in-one communication and management platform for organisations — starting with Indian schools. You'll hear from us the moment we open early access.
          </p>

          <div style="border-top:1px solid #222;padding-top:24px;color:#555;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">
            Hermes Workspace · hermesworkspace.com
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[waitlist] error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}