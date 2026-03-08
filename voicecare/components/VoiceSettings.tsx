"use client";

import { useState, useEffect } from "react";
import { useVoiceRecording } from "@/app/hooks/useVoiceRecording";
import { addVoice, listVoices } from "@/app/actions/voices";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FaMicrophone, FaStop, FaPlus, FaCheckCircle, FaUserFriends, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VoiceSettingsProps {
    onVoiceChange: (voiceId: string, voiceName: string) => void;
}

export function VoiceSettings({ onVoiceChange }: VoiceSettingsProps) {
    const [voices, setVoices] = useState<any[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
    const [newVoiceName, setNewVoiceName] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchVoices = async () => {
        try {
            const data = await listVoices();
            setVoices(data);
            // Set initial selected voice from localStorage or first one
            const savedId = localStorage.getItem("selected_voice_id");

            let activeVoice = data.find((v: any) => v.voice_id === savedId) || data[0];

            if (activeVoice) {
                setSelectedVoiceId(activeVoice.voice_id);
                onVoiceChange(activeVoice.voice_id, activeVoice.name);
            }
        } catch (error) {
            console.error("Failed to fetch voices:", error);
        }
    };

    useEffect(() => {
        fetchVoices();
    }, []);

    const handleRecordingComplete = async (blob: Blob) => {
        if (!newVoiceName.trim()) {
            toast.error("Please enter a name for your voice");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            // ElevenLabs requires at least one file
            const file = new File([blob], "voice_sample.webm", { type: "audio/webm" });
            formData.append("files", file);
            formData.append("name", newVoiceName.trim());
            formData.append("description", "Cloned voice sample");

            await addVoice(formData);
            toast.success("Voice cloned successfully!");
            setIsOpen(false);
            setNewVoiceName("");
            fetchVoices(); // Refresh list
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to clone voice");
        } finally {
            setIsSubmitting(false);
        }
    };

    const { isRecording, toggleRecording } = useVoiceRecording({
        onRecordingComplete: handleRecordingComplete,
        onError: (err) => toast.error(err),
    });

    const handleVoiceSelect = (voiceId: string) => {
        const voice = voices.find(v => v.voice_id === voiceId);
        if (voice) {
            setSelectedVoiceId(voiceId);
            localStorage.setItem("selected_voice_id", voiceId);
            onVoiceChange(voiceId, voice.name);
            toast.success(`Switched to ${voice.name}`);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl mx-auto mt-8 px-4">
            {/* Add Voice Button & Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <button className="flex-1 group relative">
                        <div className="flex items-center justify-center gap-4 px-8 py-6 rounded-3xl bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)] transition-all duration-300 border-2 border-transparent hover:border-blue-100 h-full">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                                <FaPlus className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-lg font-bold text-gray-900">Add Voice</p>
                                <p className="text-sm text-gray-500">Clone your own voice</p>
                            </div>
                        </div>
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FaMicrophone className="text-blue-600" />
                            Record Your Voice
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 space-y-6">
                        <div className="w-full space-y-2">
                            <Label htmlFor="voice-name" className="text-sm font-bold text-gray-700 ml-1">Voice Name</Label>
                            <Input
                                id="voice-name"
                                placeholder='Example: "Peter" or "Isabella"'
                                value={newVoiceName}
                                onChange={(e) => setNewVoiceName(e.target.value)}
                                className="rounded-2xl border-gray-100 focus:border-blue-300 h-12"
                            />
                        </div>

                        <p className="text-center text-sm text-gray-500 px-4">
                            {isRecording
                                ? "Speak naturally for 15-30 seconds..."
                                : 'Enter a name above, then click record. Speak naturally for about 15-30 seconds.'}
                        </p>

                        <AnimatePresence mode="wait">
                            {isSubmitting ? (
                                <motion.div
                                    key="submitting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="font-medium text-blue-700">Cloning your voice...</p>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="record"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleRecording}
                                    disabled={!newVoiceName.trim()}
                                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                                            ? 'bg-red-500 animate-pulse'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isRecording ? (
                                        <FaStop className="text-white w-10 h-10" />
                                    ) : (
                                        <FaMicrophone className="text-white w-12 h-12" />
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
                            {isRecording ? "Listening..." : "Click to Start"}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Select Voice Dropdown */}
            <div className="flex-1 group relative">
                <div className="flex items-center gap-4 px-8 py-6 rounded-3xl bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.05)] border-2 border-transparent hover:border-blue-50 transition-all duration-300 h-full">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <FaUserFriends className="w-6 h-6" />
                    </div>
                    <div className="flex-1 relative">
                        <p className="text-xs font-bold text-blue-600/60 uppercase tracking-widest mb-1">Active Voice</p>
                        <div className="relative">
                            <select
                                value={selectedVoiceId}
                                onChange={(e) => handleVoiceSelect(e.target.value)}
                                className="w-full bg-transparent text-lg font-bold text-gray-900 appearance-none focus:outline-none cursor-pointer pr-8"
                            >
                                {voices.length === 0 && <option value="">Loading voices...</option>}
                                {voices.map((v) => (
                                    <option key={v.voice_id} value={v.voice_id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                            <FaChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
