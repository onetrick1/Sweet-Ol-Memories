import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const userNotifications = await db
            .select()
            .from(notifications)
            .where(eq(notifications.user_id, parseInt(userId)));

        return NextResponse.json({ notifications: userNotifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ notifications: [] });
    }
}
