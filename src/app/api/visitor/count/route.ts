import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/visitor/count — Get total unique visitors
export async function GET() {
  try {
    const totalVisitors = await db.visitor.count();
    const totalVisits = await db.visitor.aggregate({
      _sum: { visitCount: true },
    });

    return NextResponse.json({
      uniqueVisitors: totalVisitors,
      totalVisits: totalVisits._sum.visitCount || 0,
    });
  } catch (error) {
    console.error("Visitor count error:", error);
    return NextResponse.json({ error: "Failed to get count" }, { status: 500 });
  }
}
