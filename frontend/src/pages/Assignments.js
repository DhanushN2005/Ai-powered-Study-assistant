import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Calendar, AlertCircle, Loader, Star, BookOpen, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { materialsAPI } from '../utils/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';

const Assignments = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignedQuizzes, setAssignedQuizzes] = useState([]);
    const [assignedMaterials, setAssignedMaterials] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch user
            const userResponse = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const currentUser = userResponse.data.data;
            setUser(currentUser);

            // Fetch assigned quizzes
            try {
                const quizzesResponse = await axios.get(`${API_URL}/quizzes/assigned`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAssignedQuizzes(quizzesResponse.data.data || []);
            } catch (quizError) {
                console.error('Error fetching quizzes:', quizError);
                setAssignedQuizzes([]);
            }

            // Fetch assigned materials
            try {
                const materialsResponse = await materialsAPI.getAll();
                const allMaterials = materialsResponse.data.data;
                const userAssignedMaterials = allMaterials.filter(m => {
                    const myId = currentUser._id.toString();
                    const ownerId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();

                    // distinct check: Is it mine?
                    if (ownerId === myId) return false;

                    // If not mine, it must be assigned (since backend API only returns mine or assigned)
                    return true;
                });

                setAssignedMaterials(userAssignedMaterials);
            } catch (materialError) {
                console.error('Error fetching materials:', materialError);
                setAssignedMaterials([]);
            }

        } catch (error) {
            console.error('❌ Fatal error in fetchAssignments:', error);
            toast.error('Failed to load assignments: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeQuiz = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    const handleViewMaterial = (materialId) => {
        navigate(`/materials/${materialId}`);
    };

    const handleGenerateQuiz = async (material) => {
        try {
            toast.loading('Generating quiz...', { id: 'quiz-gen' });
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/ai/questions`,
                {
                    materialId: material._id,
                    difficulty: 'medium',
                    count: 5,
                    type: 'multiple-choice'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            toast.success('Quiz generated!', { id: 'quiz-gen' });
            navigate(`/quiz/${response.data.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate quiz', { id: 'quiz-gen' });
        }
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const getDaysUntilDue = (dueDate) => {
        if (!dueDate) return null;
        const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const hasAssignments = assignedQuizzes.length > 0 || assignedMaterials.length > 0;

    return (

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10">
            {/* Background Decor */}
            <div className="fixed top-20 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="mb-8 relative">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 flex items-center gap-3">
                    <Star className="w-10 h-10 text-indigo-500 fill-indigo-500 animate-float" />
                    My Assignments
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 ml-1">
                    Tasks and resources assigned by your instructor
                </p>
            </div>

            {!hasAssignments ? (
                <div className="glass-card rounded-2xl p-12 text-center transition-all animate-slide-up">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No assignments yet</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        You're all caught up! Check back later for new tasks.
                    </p>
                </div>
            ) : (
                <div className="space-y-12 animate-slide-up">
                    {/* Assigned Materials Section */}
                    {assignedMaterials.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                Assigned Study Materials
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                    {assignedMaterials.length}
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignedMaterials.map((material, idx) => (
                                    <div
                                        key={material._id}
                                        className="glass-card rounded-xl p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                                <Star className="w-3 h-3 fill-current" />
                                                Assigned
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${material.difficulty === 'beginner'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : material.difficulty === 'advanced'
                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}
                                            >
                                                {material.difficulty || 'intermediate'}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {material.title}
                                        </h3>

                                        <div className="space-y-1 mb-6">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-gray-200">Subject:</span> {material.subject}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-gray-200">Topic:</span> {material.topic}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Added {new Date(material.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <button
                                                onClick={() => handleGenerateQuiz(material)}
                                                className="col-span-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group/btn"
                                            >
                                                <Brain className="w-4 h-4 group-hover/btn:animate-pulse" />
                                                Generate Quiz
                                            </button>
                                            <button
                                                onClick={() => handleViewMaterial(material._id)}
                                                className="col-span-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                View Material
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned Quizzes Section */}
                    {assignedQuizzes.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                Assigned Quizzes
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                    {assignedQuizzes.length}
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignedQuizzes.map((quiz, idx) => {
                                    const daysUntilDue = getDaysUntilDue(quiz.dueDate);
                                    const overdue = isOverdue(quiz.dueDate);
                                    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && !overdue;

                                    return (
                                        <div
                                            key={quiz._id}
                                            className="glass-card rounded-xl p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            {/* Status Bar */}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${overdue ? 'bg-red-500' : isDueSoon ? 'bg-amber-500' : 'bg-purple-500'
                                                }`} />

                                            <div className="flex justify-between items-start mb-4 pl-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    Required
                                                </span>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${quiz.difficulty === 'easy'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                        : quiz.difficulty === 'hard'
                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                        }`}
                                                >
                                                    {quiz.difficulty || 'medium'}
                                                </span>
                                            </div>

                                            <div className="pl-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {quiz.subject}
                                                </h3>

                                                <div className="space-y-2 mb-6">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                        {quiz.topic}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                        {quiz.questions?.length || quiz.score?.total || 0} Questions
                                                    </p>
                                                </div>

                                                {/* Due Date Indicator */}
                                                {quiz.dueDate && (
                                                    <div className={`mb-6 p-3 rounded-xl border ${overdue
                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                                                        : isDueSoon
                                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                                                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                                        }`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${overdue ? 'bg-red-100 dark:bg-red-800/50' : isDueSoon ? 'bg-amber-100 dark:bg-amber-800/50' : 'bg-blue-100 dark:bg-blue-800/50'
                                                                }`}>
                                                                {overdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wider">
                                                                    {overdue ? 'Overdue' : 'Due Date'}
                                                                </p>
                                                                <p className="text-sm font-semibold">
                                                                    {new Date(quiz.dueDate).toLocaleDateString(undefined, {
                                                                        weekday: 'short', month: 'short', day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                            {!overdue && daysUntilDue !== null && (
                                                                <div className="ml-auto text-xs font-bold px-2 py-1 rounded bg-white/50 dark:bg-black/20">
                                                                    {daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d left`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleTakeQuiz(quiz._id)}
                                                    className={`w-full py-2.5 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 group/btn ${overdue
                                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200 dark:shadow-none'
                                                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-200 dark:shadow-none'
                                                        }`}
                                                >
                                                    <Brain className="w-5 h-5 group-hover/btn:animate-wiggle" />
                                                    {overdue ? 'Take Late' : 'Start Quiz'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Assignments;
