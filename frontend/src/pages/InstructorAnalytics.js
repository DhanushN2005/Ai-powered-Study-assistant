import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const InstructorAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const response = await axios.get(`${API_URL}/instructor/analytics`, config);
            setAnalytics(response.data.data);
        } catch (error) {
            toast.error('Failed to load analytics');
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

    const totalStudents = analytics.length;
    const totalQuizzes = analytics.reduce((sum, s) => sum + s.totalQuizzes, 0);
    const avgClassScore = totalStudents > 0
        ? Math.round(analytics.reduce((sum, s) => sum + s.avgScore, 0) / totalStudents)
        : 0;
    const totalStudyTime = Math.round(analytics.reduce((sum, s) => sum + s.totalStudyTime, 0) / 60);

    // Find top performers
    const topPerformers = [...analytics]
        .filter(s => s.totalQuizzes > 0)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

    // Find students needing attention
    const needsAttention = [...analytics]
        .filter(s => s.totalQuizzes > 0 && s.avgScore < 60)
        .sort((a, b) => a.avgScore - b.avgScore);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Class Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor overall class performance</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalStudents}</p>
                        </div>
                        <Users className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Class Average</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{avgClassScore}%</p>
                        </div>
                        <BarChart3 className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Quizzes</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalQuizzes}</p>
                        </div>
                        <Target className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Study Hours</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalStudyTime}h</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Performers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        Top Performers
                    </h2>
                    {topPerformers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No quiz data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {topPerformers.map((student, index) => (
                                <div key={student.studentId} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.totalQuizzes} quizzes</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{student.avgScore}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Students Needing Attention */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                        Needs Attention
                    </h2>
                    {needsAttention.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-green-600 dark:text-green-400 font-semibold">🎉 All students performing well!</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">No students below 60% average</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {needsAttention.map((student) => (
                                <div key={student.studentId} className="flex items-center gap-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{student.avgScore}%</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{student.totalQuizzes} quizzes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* All Students Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Students Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quizzes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Study Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {analytics.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No students registered yet
                                    </td>
                                </tr>
                            ) : (
                                analytics.map((student) => (
                                    <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {student.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                            {student.totalQuizzes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${student.avgScore >= 80
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : student.avgScore >= 60
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {student.avgScore}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                            {Math.round(student.totalStudyTime / 60)}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {student.totalQuizzes === 0 ? (
                                                <span className="text-xs text-gray-500">No activity</span>
                                            ) : student.avgScore >= 70 ? (
                                                <span className="text-xs text-green-600 font-semibold">✓ On Track</span>
                                            ) : (
                                                <span className="text-xs text-red-600 font-semibold">⚠ Needs Help</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstructorAnalytics;
