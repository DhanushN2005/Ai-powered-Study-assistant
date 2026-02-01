import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const InstructorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const analyticsRes = await axios.get(`${API_URL}/instructor/analytics`, config);
            setAnalytics(analyticsRes.data.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const viewStudentDetails = async (studentId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_URL}/instructor/students/${studentId}`, config);
            setSelectedStudent(response.data.data);
        } catch (error) {
            toast.error('Failed to load student details');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor student progress and performance</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.length}</p>
                        </div>
                        <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Quiz Score</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {analytics.length > 0
                                    ? Math.round(analytics.reduce((sum, s) => sum + s.avgScore, 0) / analytics.length)
                                    : 0}%
                            </p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Quizzes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {analytics.reduce((sum, s) => sum + s.totalQuizzes, 0)}
                            </p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Student Performance</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Quizzes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Avg Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Study Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Actions
                                </th>
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
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${student.avgScore >= 70
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : student.avgScore >= 50
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {student.avgScore}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                            {Math.round(student.totalStudyTime / 60)}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => viewStudentDetails(student.studentId)}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Details Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedStudent.student.name}'s Progress
                            </h2>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                <p className="text-sm text-indigo-600 dark:text-indigo-300">Total Quizzes</p>
                                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{selectedStudent.stats.totalQuizzes}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                <p className="text-sm text-green-600 dark:text-green-300">Average Score</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{selectedStudent.stats.avgScore}%</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <p className="text-sm text-purple-600 dark:text-purple-300">Study Time</p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {Math.round(selectedStudent.stats.totalStudyTime / 60)}h
                                </p>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Quizzes</h3>
                        {selectedStudent.recentQuizzes.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No quizzes completed yet</p>
                        ) : (
                            <div className="space-y-3">
                                {selectedStudent.recentQuizzes.map((quiz) => (
                                    <div key={quiz._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{quiz.subject} - {quiz.topic}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(quiz.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.score.percentage}%</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {quiz.score.correct}/{quiz.score.total} correct
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;
