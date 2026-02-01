import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Loader } from 'lucide-react';
import { analyticsAPI, quizAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    const [quizStats, setQuizStats] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [dashboardRes, quizStatsRes] = await Promise.all([
                analyticsAPI.getDashboard(30),
                quizAPI.getStats()
            ]);

            setDashboard(dashboardRes.data.data);
            setQuizStats(quizStatsRes.data.data);
        } catch (error) {
            toast.error('Failed to load analytics');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
                <BarChart3 className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No data yet</h2>
                <p className="text-gray-600">Start studying to see your analytics</p>
            </div>
        );
    }

    const { totals, bySubject, streak, weakTopics } = dashboard;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Track your learning progress</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Study Time</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {Math.round(totals.studyTime / 60)}h
                            </p>
                        </div>
                        <Clock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {totals.quizzesTaken}
                            </p>
                        </div>
                        <Target className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Study Streak</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {streak?.current || 0} days
                            </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Materials Studied</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {totals.materialsStudied}
                            </p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>
            </div>

            {/* Subject Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subject Performance</h2>
                    {Object.keys(bySubject).length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No subject data yet</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(bySubject).map(([subject, stats]) => (
                                <div key={subject} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{subject}</h3>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {stats.quizzesTaken} quizzes
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{stats.avgAccuracy}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${stats.avgAccuracy >= 70
                                                        ? 'bg-green-500'
                                                        : stats.avgAccuracy >= 50
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${stats.avgAccuracy}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Study Time</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{Math.round(stats.studyTime / 60)}h</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weak Topics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Areas Needing Attention</h2>
                    {weakTopics && weakTopics.length > 0 ? (
                        <div className="space-y-3">
                            {weakTopics.map((topic, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {topic.subject || 'General'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {topic.topic || 'Various Topics'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {topic.totalQuizzes} quiz{topic.totalQuizzes !== 1 ? 'zes' : ''} taken
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${topic.accuracy >= 70
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    : topic.accuracy >= 50
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                }`}>
                                                {Math.round(topic.accuracy)}%
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                {Math.round(topic.studyTime / 60)}h studied
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${topic.accuracy >= 70
                                                        ? 'bg-green-600 dark:bg-green-500'
                                                        : topic.accuracy >= 50
                                                            ? 'bg-yellow-600 dark:bg-yellow-500'
                                                            : 'bg-red-600 dark:bg-red-500'
                                                    }`}
                                                style={{ width: `${Math.min(topic.accuracy, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Great job! No weak areas identified</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Keep up the good work!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quiz Statistics */}
            {quizStats && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quiz Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Quizzes</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{quizStats.totalQuizzes}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Score</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{quizStats.averageScore}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Best Score</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{quizStats.bestScore}%</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
