"use client";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { useConversation } from "@11labs/react";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import { useCallback, useEffect, useState } from "react";
import { IconType } from "react-icons";
import {
	FaBell,
	FaCalendarAlt,
	FaComments,
	FaMicrophone,
	FaPhoneAlt,
} from "react-icons/fa";
import { toast } from "sonner";
import { getDate } from "./actions/ai";
import { createTask } from "./actions/tasks";
import { AudioWave } from "./components/AudioWave";

const FeatureButton = ({
	icon: Icon,
	label,
	tooltip,
}: {
	icon: IconType;
	label: string;
	tooltip: string;
}) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<button className="group relative">
				{/* Main button container with neumorphic effect */}
				<div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-blue-50 group-hover:bg-blue-100 shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] transition-all duration-300">
					{/* Icon container */}

					<Icon className="w-6 h-6 text-blue-700" />
					{/* Label next to icon */}
					<span className="text-base font-medium text-gray-800">{label}</span>
				</div>
			</button>
		</TooltipTrigger>
		<TooltipContent side="bottom">
			<p>{tooltip}</p>
		</TooltipContent>
	</Tooltip>
);

const VoiceButton = ({ isConnected = false }: { isConnected?: boolean }) => {
	// Determine the current state for UI
	const getStateMessage = useCallback(() => {
		if (!isConnected) return "Click to talk with your Samantha";
		return "Samantha is listening...";
	}, [isConnected]);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<motion.button
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					transition={{
						duration: 2,
						repeat: Infinity,
						repeatType: "reverse",
					}}
					className="relative"
				>
					{/* Enhanced animated rings */}
					{[1, 2, 3].map((index) => (
						<motion.div
							key={index}
							className="absolute inset-0 rounded-full border-4 border-blue-500/30"
							initial={{ scale: 1, opacity: 0.4 }}
							animate={{
								scale: [1, 1.5, 2],
								opacity: [0.4, 0.3, 0],
							}}
							transition={{
								duration: 3,
								repeat: Infinity,
								delay: index * 0.5,
							}}
						/>
					))}

					{/* Main voice button */}
					<div className="relative flex items-center justify-center w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600">
						<div className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-400 to-blue-600" />
						{isConnected ? (
							<AudioWave isListening={true} />
						) : (
							<FaMicrophone className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white relative z-10" />
						)}
						{/* Accessibility text */}
						<span className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-gray-600 text-lg font-medium whitespace-nowrap">
							{getStateMessage()}
						</span>
					</div>
				</motion.button>
			</TooltipTrigger>
			<TooltipContent
				side="bottom"
				className="text-lg p-3"
			>
				<p>{getStateMessage()}</p>
			</TooltipContent>
		</Tooltip>
	);
};

const EmergencyIconButton = () => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay: 0.8 }}
		className="fixed bottom-8 right-8 z-50"
	>
		<Tooltip>
			<TooltipTrigger asChild>
				<motion.button
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-full shadow-[0_8px_32px_rgba(239,68,68,0.3)] hover:shadow-[0_16px_48px_rgba(239,68,68,0.4)] transition-all duration-300"
				>
					{/* Pulsing Background */}
					<div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-red-500 animate-pulse opacity-50 blur-lg" />

					{/* Icon */}
					<FaPhoneAlt className="relative w-8 h-8 sm:w-10 sm:h-10 text-white" />
				</motion.button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Emergency assistance (Always available)</p>
			</TooltipContent>
		</Tooltip>
	</motion.div>
);

export default function LandingPage() {
	const [isConnected, setIsConnected] = useState(false);
	const notifications = useNotifications(1);

	const conversation = useConversation({
		onConnect: () => {
			setIsConnected(true);
			toast.success("Connected to Samantha");
			posthog.capture("conversation_started", {
				hasNotifications: (notifications || []).length > 0,
				notificationCount: (notifications || []).length,
			});

			if ((notifications || []).length > 0) {
				toast.success(`You have ${(notifications || []).length} unread notifications`);
				// Samantha can proactively inform about notifications
				conversation.startSession({
					text: `You have ${(notifications || []).length} unread notifications. Would you like me to read them to you?`,
				});
			}
		},
		onDisconnect: () => {
			setIsConnected(false);
			toast.info("Disconnected from Samantha");
			posthog.capture("conversation_ended");
		},
		onError: (error: Error | any) => {
			console.error("ElevenLabs connection error details:", error);
			setIsConnected(false);
			toast.error(`Error: ${error?.message || "Connection failed. Please check your ElevenLabs API Key"}`);
			posthog.capture("conversation_error", {
				error: error?.message || "Unknown error",
				full_error: JSON.stringify(error)
			});
		},
		onMessage: (message: { text: string } | any) => {
			console.log("Message from agent:", message);
			if (message?.text) {
				toast.info(message.text);
				posthog.capture("agent_message_received", {
					messageLength: message.text.length,
				});
			} else {
				posthog.capture("agent_event_received", {
					payload: JSON.stringify(message)
				});
			}
		},
	});

	// Initialize connection on mount
	useEffect(() => {
		startConversation();
		// Cleanup on unmount
		return () => {
			stopConversation();
		};
	}, []);

	const startConversation = useCallback(async () => {
		try {
			await conversation.startSession({
				agentId: process.env.NEXT_PUBLIC_ELEVENLAB_AGENT_ID,
				clientTools: {
					set_reminders: async (props: any) => {
						console.log("Props:", props);
						const { task, datetime } = props;
						// Simulate setting a reminder
						console.log("Setting reminder:", { task, datetime });
						const absoluteDatetime = await getDate(datetime);
						const eventDate = new Date(absoluteDatetime);
						console.log(
							"Parsed date:",
							eventDate,
							"Is valid:",
							!isNaN(eventDate.getTime())
						);
						const result = await createTask({
							event_time: eventDate,
							notification_time: eventDate,
							title: task,
							type: "reminder",
							user_id: 1,
						});

						posthog.capture("reminder_set", {
							task,
							datetime: eventDate.toISOString(),
							success: result.success,
						});

						if (result.success) {
							toast.success(`Reminder set: ${task} for ${datetime}`);
							return {
								success: true,
								message: `Successfully set reminder for ${task} at ${datetime}`,
							};
						} else {
							toast.error("Failed to set reminder");
							return {
								success: false,
								message: "Failed to set reminder",
							};
						}
					},
					schedule_appointments: async ({
						title,
						datetime,
					}: {
						title: string;
						datetime: string;
					}) => {
						const absoluteDatetime = await getDate(datetime);
						const eventDate = new Date(absoluteDatetime);

						// Simulate scheduling an appointment
						const result = await createTask({
							event_time: eventDate,
							notification_time: eventDate,
							title: title,
							type: "appointment",
							user_id: 1,
						});

						posthog.capture("appointment_scheduled", {
							title,
							datetime: eventDate.toISOString(),
							success: result.success,
						});

						// Here you would typically:
						// 1. Parse the datetime string
						// 2. Check for conflicts
						// 3. Store in calendar system
						// 4. Set up notifications
						if (result.success) {
							toast.success(`Appointment scheduled: ${title} for ${datetime}`);
							return {
								success: true,
								message: `I've scheduled your ${title} for ${datetime}`,
							};
						} else {
							toast.error("Failed to schedule appointment");
							return {
								success: false,
								message: "Failed to schedule appointment",
							};
						}
					},
					emergency_help: async ({
						message = "Emergency help requested",
					}: {
						message?: string;
					}) => {
						// Simulate emergency response
						console.log("Emergency alert triggered:", message);
						toast.error("Emergency Alert: " + message, {
							duration: 10000, // Show for longer
						});

						// Here you would typically:
						// 1. Send SMS to emergency contacts
						// 2. Trigger emergency protocols
						// 3. Log the emergency
						return {
							success: true,
							message:
								"Emergency services have been notified. Help is on the way.",
						};
					},
				},
			});
		} catch (error) {
			setIsConnected(false);
			toast.error("Failed to start conversation: " + (error as Error).message);
		}
	}, [conversation]);

	const stopConversation = useCallback(async () => {
		try {
			await conversation.endSession();
			setIsConnected(false);
		} catch (error) {
			toast.error("Failed to end conversation: " + (error as Error).message);
		}
	}, [conversation]);

	return (
		<TooltipProvider>
			<div className="relative h-screen bg-[#F8FAFC] flex flex-col justify-between overflow-hidden">
				{/* Subtle, comfortable background pattern */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div
						className="absolute inset-0 opacity-30"
						style={{
							backgroundImage: `radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)`,
							backgroundSize: "32px 32px",
						}}
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/50" />
				</div>

				{/* Main content with improved spacing */}
				<div className="relative flex flex-col items-center w-full max-w-7xl mx-auto px-6 py-12">
					{/* Welcome text with better contrast */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center mb-24"
					>
						<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight flex items-baseline gap-2">
							<span className="text-blue-700">VoiceCare</span>{" "}
							<span className="font-extralighta text-gray-600 text-3xl md:text-4xl">
								AI Companion for Elderly
							</span>
						</h1>
						<p className="text-lg md:text-xl text-gray-800 mb-2">
							Just speak naturally to control the app
						</p>
						<p className="text-md text-gray-600">
							Try saying: &quot;Set a reminder&quot; or &quot;Call for
							help&quot;
						</p>
					</motion.div>

					{/* Rest of the content */}
					<div className="relative flex flex-col items-center w-full">
						{/* Center voice button */}
						<div className="mb-28">
							<VoiceButton isConnected={isConnected} />
						</div>

						{/* Feature buttons section */}

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl mx-auto mt-10">
							<FeatureButton
								icon={FaBell}
								label="Set Reminders"
								tooltip="Set medication and appointment reminders"
							/>
							<FeatureButton
								icon={FaCalendarAlt}
								label="Set Appointments"
								tooltip="Schedule and manage appointments"
							/>
							<FeatureButton
								icon={FaComments}
								label="Companionship"
								tooltip="24/7 companionship and support"
							/>
						</div>
					</div>
				</div>

				{/* Emergency button */}
				<EmergencyIconButton />
			</div>
		</TooltipProvider>
	);
}
