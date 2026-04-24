import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/feedback — Save user feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, anonymousId } = body;

    if (!type || !message || !message.trim()) {
      return NextResponse.json(
        { error: "type and message are required" },
        { status: 400 }
      );
    }

    const validTypes = ["bug", "feature", "love", "other"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    const feedback = await db.feedback.create({
      data: {
        type,
        message: message.trim(),
        anonymousId: anonymousId || null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error("Feedback save error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

// GET /api/feedback — Get all feedback (for admin)
export async function GET() {
  try {
    const feedbacks = await db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ feedbacks, total: feedbacks.length });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
