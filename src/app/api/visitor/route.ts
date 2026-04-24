import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/visitor — Track a visit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { anonymousId } = body;

    if (!anonymousId || typeof anonymousId !== "string") {
      return NextResponse.json({ error: "anonymousId required" }, { status: 400 });
    }

    // Upsert: if visitor exists, update visitCount + lastVisitAt; else create new
    const visitor = await db.visitor.upsert({
      where: { anonymousId },
      update: {
        lastVisitAt: new Date(),
        visitCount: { increment: 1 },
      },
      create: {
        anonymousId,
        firstVisitAt: new Date(),
        lastVisitAt: new Date(),
        visitCount: 1,
      },
    });

    return NextResponse.json({
      success: true,
      visitCount: visitor.visitCount,
      isNew: visitor.visitCount === 1,
    });
  } catch (error) {
    console.error("Visitor tracking error:", error);
    return NextResponse.json({ error: "Failed to track visit" }, { status: 500 });
  }
}
