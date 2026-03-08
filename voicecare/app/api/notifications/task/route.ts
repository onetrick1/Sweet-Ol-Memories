import { db } from "@/lib/db/drizzle";
import { notifications, tasks, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { task_id, type, title, user_id } = body;

		// 1. Get task and user details
		const [task] = await db
			.select()
			.from(tasks)
			.where(eq(tasks.task_id, task_id));

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.user_id, user_id));

		if (!task || !user) {
			throw new Error("Task or user not found");
		}

		// 2. Store notification in a new notifications table
		// This will be polled by the client
		await db.insert(notifications).values({
			user_id,
			task_id,
			type,
			title,
			read: false,
			created_at: new Date(),
		});

		return NextResponse.json({
			success: true,
			message: `Notification stored for ${type}: ${title}`,
		});

		// // 2. Handle different notification types
		// if (type === "reminder") {
		// 	// Trigger reminder notification
		// 	// Here you could:
		// 	// 1. Send push notification
		// 	// 2. Send email
		// 	// 3. Send SMS
		// 	// 4. Trigger AI agent to interact
		// } else if (type === "appointment") {
		// 	// Handle appointment notification
		// 	// Similar to reminder but maybe with different message format
		// }

		// return NextResponse.json({
		// 	success: true,
		// 	message: `Notification sent for ${type}: ${title}`,
		// });
	} catch (error) {
		console.error("Error processing notification:", error);
		return NextResponse.json(
			{ error: "Failed to process notification" },
			{ status: 500 }
		);
	}
}
