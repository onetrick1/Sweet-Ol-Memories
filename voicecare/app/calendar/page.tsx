"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { getTasks } from "../actions/tasks";
import { Task } from "@/lib/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaCalendarAlt, FaBell, FaHospital } from "react-icons/fa";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CalendarPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTasks() {
            try {
                const data = await getTasks(1); // Assuming user_id 1 for now
                setTasks(data);
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTasks();
    }, []);

    const selectedDayTasks = tasks.filter((task) =>
        date ? isSameDay(new Date(task.event_time), date) : false
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)`,
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>

            <div className="relative max-w-5xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <Link
                        href="/"
                        className="group flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 text-blue-700 font-medium"
                    >
                        <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FaCalendarAlt className="text-blue-700" />
                        Your Schedule
                    </h1>
                    <div className="w-24" /> {/* Spacer */}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Calendar Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        <Card className="rounded-3xl border-none shadow-[4px_4px_20px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
                            <CardContent className="p-6">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border-none w-full"
                                    classNames={{
                                        day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-600 rounded-2xl",
                                        day_today: "bg-blue-50 text-blue-700 font-bold rounded-2xl",
                                        day: "text-lg p-4 font-medium rounded-2xl hover:bg-gray-100",
                                        head_cell: "text-gray-500 font-medium text-lg pb-4",
                                        nav_button: "text-blue-700 hover:bg-blue-50 rounded-xl p-2",
                                    }}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 italic text-blue-800 text-sm">
                            <p>Tip: Selected dates will show all reminders and appointments scheduled for that day.</p>
                        </div>
                    </motion.div>

                    {/* Tasks Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">
                            {date ? format(date, "MMMM do, yyyy") : "Selected Day"}
                        </h2>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <motion.p key="loading" className="text-gray-500 italic p-4">Loading your schedule...</motion.p>
                                ) : selectedDayTasks.length > 0 ? (
                                    selectedDayTasks.map((task) => (
                                        <motion.div
                                            key={task.task_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group relative"
                                        >
                                            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white shadow-[2px_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[4px_4px_15px_rgba(0,0,0,0.06)] transition-all duration-300 border-l-4 border-blue-500">
                                                <div className={`p-4 rounded-2xl ${task.type === 'appointment' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {task.type === 'appointment' ? <FaHospital className="w-6 h-6" /> : <FaBell className="w-6 h-6" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                                                        <Badge variant="outline" className={`rounded-lg capitalize ${task.type === 'appointment' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                            {task.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-gray-600 font-medium">
                                                        {format(new Date(task.event_time), "h:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center p-12 rounded-3xl bg-white/50 border-2 border-dashed border-gray-200"
                                    >
                                        <FaCalendarAlt className="w-12 h-12 text-gray-300 mb-4" />
                                        <p className="text-gray-500 text-lg">No events scheduled for this day</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
