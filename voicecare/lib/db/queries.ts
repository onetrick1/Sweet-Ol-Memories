import { and, eq, gt } from "drizzle-orm";
import { db } from "./drizzle";
import { emergencyContacts, tasks } from "./schema";

type TaskInput = {
	user_id: number;
	type: "reminder" | "appointment";
	title: string;
	event_time: Date;
	notification_time: Date;
};

// Type for emergency contact creation
type EmergencyContactInput = {
	user_id: number;
	name: string;
	phone_number: string;
	email?: string;
};

export async function insertTask({
	user_id,
	type,
	title,
	event_time,
	notification_time,
}: TaskInput) {
	try {
		const result = await db
			.insert(tasks)
			.values({
				user_id,
				type,
				title,
				event_time,
				notification_time,
			})
			.returning();

		return result[0];
	} catch (error) {
		console.error("Error inserting task:", error);
		throw new Error("Failed to create task");
	}
}

export async function getTasksByUser(userId: number) {
	try {
		const result = await db
			.select()
			.from(tasks)
			.where(eq(tasks.user_id, userId))
			.orderBy(tasks.event_time); // Sort by event time

		return result;
	} catch (error) {
		console.error("Error fetching tasks:", error);
		throw new Error("Failed to fetch tasks");
	}
}

export async function insertEmergencyContact({
	user_id,
	name,
	phone_number,
	email,
}: EmergencyContactInput) {
	try {
		const result = await db
			.insert(emergencyContacts)
			.values({
				user_id,
				name,
				phone_number,
				email,
			})
			.returning();

		return result[0];
	} catch (error) {
		console.error("Error inserting emergency contact:", error);
		throw new Error("Failed to create emergency contact");
	}
}

export async function getEmergencyContactsByUser(userId: number) {
	try {
		const result = await db
			.select()
			.from(emergencyContacts)
			.where(eq(emergencyContacts.user_id, userId));

		return result;
	} catch (error) {
		console.error("Error fetching emergency contacts:", error);
		throw new Error("Failed to fetch emergency contacts");
	}
}

export async function getUpcomingTasks(userId: number) {
	try {
		const now = new Date();
		const result = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.user_id, userId), gt(tasks.event_time, now)))
			.orderBy(tasks.event_time)
			.limit(5);

		return result;
	} catch (error) {
		console.error("Error fetching upcoming tasks:", error);
		throw new Error("Failed to fetch upcoming tasks");
	}
}
