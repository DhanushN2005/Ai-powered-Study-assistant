
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, XCircle, Loader, Home, Brain } from 'lucide-react';
import { quizAPI } from '../utils/api';

const QuizResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchQuizResults = useCallback(async () => {
        try {
            const response = await quizAPI.getOne(id);
            setQuiz(response.data.data);
        } catch (error) {
            navigate('/materials');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchQuizResults();
    }, [fetchQuizResults]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!quiz || !quiz.completed) {
        navigate(`/quiz/${id}`);
        return null;
    }

    const { score, questions } = quiz;
    const percentage = score.percentage;
    const passed = percentage >= 70;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Results</h1>
                <p className="text-gray-600 dark:text-white mt-2">{quiz.subject} - {quiz.topic}</p>
            </div>

            {/* Score Card */}
            <div className={`rounded-lg shadow-lg p-8 mb-8 ${passed ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
                }`}>
                <div className="text-center">
                    <Award className={`w-16 h-16 mx-auto mb-4 ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{percentage}%</h2>
                    <p className="text-xl text-gray-700 dark:text-white mb-4">
                        {score.correct} out of {score.total} correct
                    </p>
                    <div className={`inline-block px-6 py-2 rounded-full text-lg font-semibold ${passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                        {passed ? '🎉 Passed!' : '📚 Keep Practicing'}
                    </div>
                </div>
            </div>

            {/* Question Review */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 transition-colors">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Question Review</h3>
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div
                            key={index}
                            className={`border-l-4 p-4 rounded-r-lg ${question.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                }`}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                {question.isCorrect ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Question {index + 1}: {question.question}
                                    </p>

                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-white">Your answer: </span>
                                            <span className={question.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                                {question.userAnswer || 'Not answered'}
                                            </span>
                                        </div>

                                        {!question.isCorrect && (
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-white">Correct answer: </span>
                                                <span className="text-green-700 dark:text-green-400">{question.correctAnswer}</span>
                                            </div>
                                        )}

                                        {question.explanation && (
                                            <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                                <p className="font-medium text-gray-700 dark:text-white mb-1">Explanation:</p>
                                                <p className="text-gray-600 dark:text-white">{question.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                {!passed && quiz.material && (
                    <button
                        onClick={() => navigate('/materials')}
                        className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Brain className="w-5 h-5" />
                        Reattempt Quiz
                    </button>
                )}
                <button
                    onClick={() => navigate('/materials')}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Home className="w-5 h-5" />
                    Back to Materials
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                >
                    View Dashboard
                </button>
            </div>
        </div>
    );
};

export default QuizResults;
