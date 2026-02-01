import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BookOpen, Brain, Calendar, ChevronLeft,
    FileText, Zap,
    Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { materialsAPI } from '../utils/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';

const MaterialDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [material, setMaterial] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // summary, content, flashcards
    const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [flippedCards, setFlippedCards] = useState({});

    const fetchMaterial = async () => {
        try {
            const response = await materialsAPI.getOne(id);
            setMaterial(response.data.data);

            // Default to flashcards if they exist, otherwise summary
            if (response.data.data.flashcards && response.data.data.flashcards.length > 0) {
                setActiveTab('flashcards');
            }
        } catch (error) {
            toast.error('Failed to load material');
            navigate('/materials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterial();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;

        try {
            toast.loading('Deleting...', { id: 'delete' });
            await materialsAPI.delete(id);
            toast.success('Material deleted', { id: 'delete' });
            navigate('/materials');
        } catch (error) {
            toast.error('Failed to delete material', { id: 'delete' });
        }
    };

    const handleGenerateQuiz = async () => {
        try {
            toast.loading('Generating quiz...', { id: 'quiz-gen' });
            // ... (rest as before)
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/ai/questions`,
                {
                    materialId: id,
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

    const handleGenerateFlashcards = async () => {
        setGeneratingFlashcards(true);
        try {
            toast.loading('Generating flashcards...', { id: 'fc-gen' });
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/materials/${id}/flashcards`,
                { count: 10 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Flashcards generated!', { id: 'fc-gen' });
            fetchMaterial(); // Refresh to show new cards
            setActiveTab('flashcards');
        } catch (error) {
            toast.error('Failed to generate flashcards');
        } finally {
            setGeneratingFlashcards(false);
        }
    };


    const handleGenerateSummary = async () => {
        setGeneratingSummary(true);
        try {
            toast.loading('Generating summary...', { id: 'sum-gen' });
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/ai/summary`,
                { content: material.content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // To make this permanent, we should save it to the material
            // But for now, we'll just update the local state
            setMaterial(prev => ({
                ...prev,
                summary: response.data.data.summary
            }));

            toast.success('Summary generated!', { id: 'sum-gen' });
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate summary', { id: 'sum-gen' });
        } finally {
            setGeneratingSummary(false);
        }
    };

    const toggleCard = (index) => {
        setFlippedCards(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!material) return null;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm transition-colors"
                    >
                        Delete Material
                    </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{material.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-white">
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {material.subject}
                            </span>
                            <span className="flex items-center gap-1">
                                <Brain className="w-4 h-4" />
                                {material.topic}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(material.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateQuiz}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Brain className="w-5 h-5" />
                        Generate Quiz
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'summary'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-200'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Summary
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'content'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-200'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Full Content
                </button>
                <button
                    onClick={() => setActiveTab('flashcards')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'flashcards'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-200'
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    Flashcards
                    {material.flashcards?.length > 0 && (
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs">
                            {material.flashcards.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px] p-8 transition-colors">
                {activeTab === 'summary' && (
                    <div className="prose max-w-none dark:prose-invert">
                        {material.summary ? (
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    AI Summary
                                </h3>
                                <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                                    {material.summary}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No summary available</h3>
                                <p className="text-gray-500 dark:text-white mb-6">
                                    This material hasn't been summarized yet.
                                </p>
                                <button
                                    onClick={handleGenerateSummary}
                                    disabled={generatingSummary}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    {generatingSummary ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Summarizing...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-5 h-5" />
                                            Generate AI Summary
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="prose max-w-none dark:prose-invert">
                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-white leading-relaxed">
                                {material.content}
                            </pre>
                        </div>
                    </div>
                )}

                {activeTab === 'flashcards' && (
                    <div>
                        {(!material.flashcards || material.flashcards.length === 0) ? (
                            <div className="text-center py-16">
                                <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No flashcards yet</h3>
                                <p className="text-gray-500 dark:text-white mb-8 max-w-md mx-auto">
                                    Use AI to automatically find key concepts and generate study flashcards from this material.
                                </p>
                                <button
                                    onClick={handleGenerateFlashcards}
                                    disabled={generatingFlashcards}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    {generatingFlashcards ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Generate Flashcards with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {material.flashcards.map((card, index) => (
                                    <div
                                        key={index}
                                        onClick={() => toggleCard(index)}
                                        className="cursor-pointer perspective-1000 h-64 group"
                                    >
                                        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flippedCards[index] ? 'rotate-y-180' : ''
                                            }`}>
                                            {/* Front */}
                                            <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all flex flex-col items-center justify-center text-center">
                                                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-4">Question</span>
                                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                    {card.question}
                                                </p>
                                                <p className="mt-4 text-xs text-gray-400">Click to flip</p>
                                            </div>

                                            {/* Back */}
                                            <div className="absolute w-full h-full backface-hidden bg-indigo-600 dark:bg-indigo-700 rounded-xl p-6 shadow-lg rotate-y-180 flex flex-col items-center justify-center text-center text-white">
                                                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-4">Answer</span>
                                                <p className="text-lg font-medium">
                                                    {card.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style jsx>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default MaterialDetail;
