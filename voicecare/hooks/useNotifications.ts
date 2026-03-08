// app/hooks/useNotifications.ts
"use client";

import { useConversation } from "@11labs/react";
import { useEffect, useState } from "react";

export function useNotifications(userId: number) {
	const [notifications, setNotifications] = useState([]);
	const conversation = useConversation({
		onMessage: (message: string) => {
			// Handle messages from ElevenLabs
			console.log("Message from agent:", message);
		},
	});

	useEffect(() => {
		const pollNotifications = async () => {
			try {
				const response = await fetch(`/api/notifications/user/${userId}`);
				const data = await response.json();

				if (data.notifications.length > 0) {
					// If we have unread notifications and active conversation
					// Let the AI agent know about them
					if (conversation) {
						await conversation.startSession({
							text: `You have ${data.notifications.length} new notifications. Would you like me to read them to you?`,
						});
					}
					setNotifications(data.notifications);
				}
			} catch (error) {
				console.error("Error polling notifications:", error);
			}
		};

		// Poll every 30 seconds
		const interval = setInterval(pollNotifications, 30000);
		return () => clearInterval(interval);
	}, [userId, conversation]);

	return notifications;
}
