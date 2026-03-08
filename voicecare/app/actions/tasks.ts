"use server";

import { db } from "@/lib/db/drizzle";
import { tasks } from "@/lib/db/schema";
import { Client } from "@upstash/qstash";

const qstashClient = new Client({
	token: process.env.QSTASH_TOKEN!,
});

export async function createTask(data: {
	user_id: number;
	type: "reminder" | "appointment";
	title: string;
	event_time: Date;
	notification_time: Date;
}) {
	try {
		// 1. Insert task into database
		const [task] = await db.insert(tasks).values(data).returning();

		// 2. Schedule notification with QStash
		const scheduleResponse = await qstashClient.publishJSON({
			url: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/task`,
			body: {
				task_id: task.task_id,
				type: task.type,
				title: task.title,
				user_id: task.user_id,
			},
			// Calculate delay in seconds from now until notification_time
			delay: Math.max(
				0,
				(new Date(data.notification_time).getTime() - Date.now()) / 1000
			),
		});

		return {
			success: true,
			task,
			scheduleId: scheduleResponse.messageId,
		};
	} catch (error) {
		console.error("Error creating task:", error);
		throw new Error("Failed to create task");
	}
}
