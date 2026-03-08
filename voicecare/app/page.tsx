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
import { createTask, getTasks } from "./actions/tasks";
import { AudioWave } from "./components/AudioWave";
import Link from "next/link";
import { VoiceSettings } from "@/components/VoiceSettings";
import { Calendar } from "@/components/ui/calendar";
import { isSameDay, format } from "date-fns";
import { FaHospital } from "react-icons/fa";

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

const VoiceButton = ({ isConnected = false, name = "Samantha" }: { isConnected?: boolean, name?: string }) => {
	// Determine the current state for UI
	const getStateMessage = useCallback(() => {
		if (!isConnected) return `Click to talk with ${name}`;
		return `${name} is listening...`;
	}, [isConnected, name]);

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


export default function LandingPage() {
	const [isConnected, setIsConnected] = useState(false);
	const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
	const [selectedVoiceName, setSelectedVoiceName] = useState<string>("Samantha");
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [tasks, setTasks] = useState<any[]>([]);
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);

	const notifications = useNotifications(1);

	const fetchTasks = useCallback(async () => {
		if (!date) return;
		setIsLoadingTasks(true);
		try {
			const data = await getTasks(1);
			setTasks(data.filter((t: any) => isSameDay(new Date(t.event_time), date)));
		} catch (error) {
			console.error("Failed to fetch tasks:", error);
		} finally {
			setIsLoadingTasks(false);
		}
	}, [date]);

	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	const conversation = useConversation({
		onConnect: () => {
			setIsConnected(true);
			toast.success(`Connected to ${selectedVoiceName}`);
			posthog.capture("conversation_started", {
				voiceId: selectedVoiceId,
				voiceName: selectedVoiceName
			});

			if ((notifications || []).length > 0) {
				toast.success(`You have ${(notifications || []).length} unread notifications`);
				conversation.startSession({
					text: `You have ${(notifications || []).length} unread notifications. Would you like me to read them to you?`,
				});
			}
		},
		onDisconnect: () => {
			setIsConnected(false);
			toast.info(`Disconnected from ${selectedVoiceName}`);
			posthog.capture("conversation_ended");
		},
		onError: (error: Error | any) => {
			console.error("ElevenLabs connection error details:", error);
			setIsConnected(false);
			toast.error(`Error: ${error?.message || "Connection failed."}`);
		},
		onMessage: (message: { text: string } | any) => {
			if (message?.text) {
				toast.info(message.text);
			}
		},
	});

	const startConversation = useCallback(async () => {
		try {
			await conversation.startSession({
				agentId: process.env.NEXT_PUBLIC_ELEVENLAB_AGENT_ID,
				overrides: {
					agent: {
						prompt: {
							prompt: `You are ${selectedVoiceName}, a friendly and helpful AI companion for the elderly. Your goal is to provide companionship and help manage reminders or appointments. Be patient, warm, and use clear, simple language. If the user asks you to set a reminder or appointment, use the tools provided.`,
						},
						firstMessage: `Hello! I'm ${selectedVoiceName}. How can I help you today?`,
					},
					tts: {
						voiceId: selectedVoiceId || process.env.NEXT_PUBLIC_ELEVENLAB_VOICE_ID,
					}
				},
				clientTools: {
					set_reminders: async (props: any) => {
						const { task, datetime } = props;
						const absoluteDatetime = await getDate(datetime);
						const eventDate = new Date(absoluteDatetime);
						const result = await createTask({
							event_time: eventDate,
							notification_time: eventDate,
							title: task,
							type: "reminder",
							user_id: 1,
						});

						if (result.success) {
							fetchTasks();
							toast.success(`Reminder set: ${task} for ${datetime}`);
							return { success: true, message: `Successfully set reminder for ${task} at ${datetime}` };
						}
						return { success: false, message: "Failed to set reminder" };
					},
					schedule_appointments: async ({ title, datetime }: { title: string; datetime: string }) => {
						const absoluteDatetime = await getDate(datetime);
						const eventDate = new Date(absoluteDatetime);

						const result = await createTask({
							event_time: eventDate,
							notification_time: eventDate,
							title: title,
							type: "appointment",
							user_id: 1,
						});

						if (result.success) {
							fetchTasks();
							toast.success(`Appointment scheduled: ${title} for ${datetime}`);
							return { success: true, message: `I've scheduled your ${title} for ${datetime}` };
						}
						return { success: false, message: "Failed to schedule appointment" };
					},
					emergency_help: async ({ message = "Emergency help requested" }) => {
						toast.error("Emergency Alert: " + message, { duration: 10000 });
						return { success: true, message: "Emergency services have been notified." };
					},
				},
			});
		} catch (error) {
			toast.error("Failed to start conversation: " + (error as Error).message);
		}
	}, [conversation, selectedVoiceId, selectedVoiceName, fetchTasks]);

	const stopConversation = useCallback(async () => {
		try {
			await conversation.endSession();
			setIsConnected(false);
		} catch (error) {
			toast.error("Failed to end conversation: " + (error as Error).message);
		}
	}, [conversation]);

	const handleVoiceChange = (id: string, name: string) => {
		setSelectedVoiceId(id);
		setSelectedVoiceName(name);
		if (isConnected) {
			stopConversation();
			toast.info("Restart the conversation to apply the new voice.");
		}
	};

	const toggleMic = () => {
		if (isConnected) {
			stopConversation();
		} else {
			startConversation();
		}
	};

	return (
		<TooltipProvider>
			<div className="relative min-h-screen bg-[#F8FAFC] flex flex-col overflow-x-hidden">
				{/* Background Pattern */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div
						className="absolute inset-0 opacity-30"
						style={{
							backgroundImage: `radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)`,
							backgroundSize: "32px 32px",
						}}
					/>
				</div>

				{/* Main Content */}
				<main className="relative flex flex-col items-center w-full max-w-7xl mx-auto px-6 py-12 pb-24">
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center mb-16"
					>
						<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
							<span className="text-blue-700">VoiceCare</span>{" "}
							<span className="font-extralight text-gray-600">
								AI Companion
							</span>
						</h1>
						<p className="text-lg text-gray-800 mb-2">
							Click the microphone to start talking with <span className="font-bold text-blue-700">{selectedVoiceName}</span>
						</p>
					</motion.div>

					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-6xl">
						{/* Left Side: Voice Control */}
						<div className="lg:col-span-5 flex flex-col items-center justify-center space-y-12">
							<div onClick={toggleMic} className="cursor-pointer">
								<VoiceButton isConnected={isConnected} name={selectedVoiceName} />
							</div>

							<div className="w-full">
								<VoiceSettings onVoiceChange={handleVoiceChange} />
							</div>
						</div>

						{/* Right Side: Calendar & Tasks */}
						<div className="lg:col-span-7 space-y-8">
							<div className="bg-white p-6 rounded-[2.5rem] shadow-[4px_4px_20px_rgba(0,0,0,0.05)]">
								<div className="flex items-center gap-3 mb-6 px-2">
									<FaCalendarAlt className="text-blue-700 w-6 h-6" />
									<h2 className="text-2xl font-bold text-gray-800">Your Schedule</h2>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="flex justify-center">
										<Calendar
											mode="single"
											selected={date}
											onSelect={setDate}
											className="rounded-2xl border-none shadow-sm"
										/>
									</div>

									<div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
										<p className="text-sm font-bold text-blue-600 uppercase tracking-widest px-1">
											{date ? format(date, "MMMM do") : "Today"}
										</p>

										{isLoadingTasks ? (
											<p className="text-gray-400 italic text-sm">Loading tasks...</p>
										) : tasks.length > 0 ? (
											tasks.map((task) => (
												<div key={task.task_id} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-4">
													<div className={`p-2 rounded-xl ${task.type === 'appointment' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
														{task.type === 'appointment' ? <FaHospital className="w-4 h-4" /> : <FaBell className="w-4 h-4" />}
													</div>
													<div>
														<p className="font-bold text-gray-900 text-sm">{task.title}</p>
														<p className="text-xs text-gray-500">{format(new Date(task.event_time), "h:mm a")}</p>
													</div>
												</div>
											))
										) : (
											<div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
												<p className="text-gray-400 text-sm">No events scheduled</p>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-6">
								<FeatureButton icon={FaBell} label="Reminders" tooltip="Set medication reminders" />
								<FeatureButton icon={FaCalendarAlt} label="Appointments" tooltip="Schedule doctor visits" />
								<FeatureButton icon={FaComments} label="Chat" tooltip="Talk about your day" />
							</div>
						</div>
					</div>
				</main>
			</div>
		</TooltipProvider>
	);
}
