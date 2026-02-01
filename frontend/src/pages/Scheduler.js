import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { schedulerAPI } from '../utils/api';

const Scheduler = () => {
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [newSession, setNewSession] = useState({
        subject: '',
        topic: '',
        duration: 60,
        date: new Date().toISOString().split('T')[0],
        time: '09:00'
    });

    useEffect(() => {
        fetchSessions();
    }, [currentMonth]);

    const fetchSessions = async () => {
        try {
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const response = await schedulerAPI.getSessions({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            setSessions(response.data.data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSession = async (e) => {
        e.preventDefault();
        try {
            const scheduledDateTime = new Date(`${newSession.date}T${newSession.time}`);

            const sessionData = {
                subject: newSession.subject,
                topic: newSession.topic,
                duration: newSession.duration,
                scheduledFor: scheduledDateTime.toISOString(),
                type: 'practice'
            };

            await schedulerAPI.createSession(sessionData);
            toast.success('Study session scheduled!');
            setShowAddModal(false);
            setNewSession({
                subject: '',
                topic: '',
                duration: 60,
                date: new Date().toISOString().split('T')[0],
                time: '09:00'
            });
            fetchSessions();
        } catch (error) {
            console.error('Schedule error:', error);
            toast.error(error.response?.data?.message || 'Failed to schedule session');
        }
    };

    const handleCompleteSession = async (sessionId) => {
        try {
            await schedulerAPI.completeSession(sessionId);
            toast.success('Session marked as complete!');
            fetchSessions();
        } catch (error) {
            toast.error('Failed to update session');
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (window.confirm('Delete this study session?')) {
            try {
                await schedulerAPI.deleteSession(sessionId);
                toast.success('Session deleted');
                fetchSessions();
            } catch (error) {
                toast.error('Failed to delete session');
            }
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days in month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getSessionsForDate = (date) => {
        if (!date) return [];
        try {
            // Compare dates using local time string to avoid timezone issues
            const targetDateStr = date.toDateString();

            return sessions.filter(session => {
                if (!session.scheduledFor) return false;
                try {
                    const sessionDate = new Date(session.scheduledFor);
                    // Check if date is valid
                    if (isNaN(sessionDate.getTime())) return false;
                    return sessionDate.toDateString() === targetDateStr;
                } catch (e) {
                    return false;
                }
            });
        } catch (e) {
            return [];
        }
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        if (!date) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const days = getDaysInMonth(currentMonth);
    const selectedDateSessions = getSessionsForDate(selectedDate);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Scheduler</h1>
                    <p className="text-gray-600 dark:text-white mt-2">Plan and track your study sessions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Schedule Session
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={previousMonth}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
                            >
                                ←
                            </button>
                            <button
                                onClick={nextMonth}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
                            >
                                →
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-white py-2">
                                {day}
                            </div>
                        ))}

                        {days.map((date, index) => {
                            const daySessions = getSessionsForDate(date);
                            const completedCount = daySessions.filter(s => s.completed).length;
                            const totalCount = daySessions.length;

                            return (
                                <button
                                    key={index}
                                    onClick={() => date && setSelectedDate(date)}
                                    disabled={!date}
                                    className={`aspect-square p-2 rounded-lg text-sm transition-all ${!date
                                        ? 'invisible'
                                        : isToday(date)
                                            ? 'bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-600 dark:border-indigo-400 font-bold'
                                            : isSelected(date)
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-400 dark:border-indigo-500'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        }`}
                                >
                                    {date && (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <span className={isToday(date) ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}>
                                                {date.getDate()}
                                            </span>
                                            {totalCount > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {Array.from({ length: Math.min(totalCount, 3) }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-1.5 h-1.5 rounded-full ${i < completedCount ? 'bg-green-500' : 'bg-indigo-400'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sessions for Selected Date */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h2>

                    {selectedDateSessions.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-white">No sessions scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateSessions.map((session) => (
                                <div
                                    key={session._id}
                                    className={`border rounded-lg p-4 transition-colors ${session.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{session.subject}</h3>
                                            <p className="text-sm text-gray-600 dark:text-white">{session.topic}</p>
                                        </div>
                                        {session.completed && (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white mb-3">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {new Date(session.scheduledFor).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        <span>•</span>
                                        <span>{session.duration} min</span>
                                    </div>

                                    <div className="flex gap-2">
                                        {!session.completed && (
                                            <button
                                                onClick={() => handleCompleteSession(session._id)}
                                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Complete
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteSession(session._id)}
                                            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Session Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Study Session</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                <input
                                    type="text"
                                    required
                                    value={newSession.subject}
                                    onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Mathematics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
                                <input
                                    type="text"
                                    required
                                    value={newSession.topic}
                                    onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Calculus"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={newSession.date}
                                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                                <input
                                    type="time"
                                    required
                                    value={newSession.time}
                                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="15"
                                    max="480"
                                    step="15"
                                    value={newSession.duration}
                                    onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scheduler;
