import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI } from '../utils/api';

const Quiz = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuiz();
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [id]);

    const fetchQuiz = async () => {
        try {
            const response = await quizAPI.getOne(id);
            setQuiz(response.data.data);
        } catch (error) {
            toast.error('Failed to load quiz');
            navigate('/materials');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionIndex, answer) => {
        setAnswers({ ...answers, [questionIndex]: answer });
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            toast.error('Please answer all questions');
            return;
        }

        setSubmitting(true);
        try {
            const answerArray = quiz.questions.map((_, index) => answers[index]);
            await quizAPI.submit(id, { answers: answerArray, timeSpent });
            toast.success('Quiz submitted!');
            navigate(`/quiz/${id}/results`);
        } catch (error) {
            toast.error('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!quiz) return null;

    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz</h1>
                <p className="text-gray-600 dark:text-white mt-2">{quiz.subject} - {quiz.topic}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-white mb-2">
                    <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 transition-colors">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    {question.question}
                </h2>

                <div className="space-y-3">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(currentQuestion, option)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestion] === option
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-500'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion] === option
                                    ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {answers[currentQuestion] === option && (
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <span className="text-gray-900 dark:text-white">{option}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>

                {currentQuestion < quiz.questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentQuestion(currentQuestion + 1)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Quiz'
                        )}
                    </button>
                )}
            </div>

            {/* Answer Status */}
            <div className="mt-6 flex flex-wrap gap-2">
                {quiz.questions.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${answers[index]
                            ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                            : currentQuestion === index
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Quiz;
