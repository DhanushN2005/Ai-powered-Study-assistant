import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Loader, X, BookOpen, Brain, Calendar, Eye, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { materialsAPI, aiAPI, authAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Materials = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [flippedModalCards, setFlippedModalCards] = useState({});
    const [uploading, setUploading] = useState(false);
    const [quizSettings, setQuizSettings] = useState({
        count: 5,
        difficulty: 'medium'
    });
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        topic: '',
        difficulty: 'intermediate'
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const fetchUser = useCallback(async () => {
        try {
            const response = await authAPI.getProfile();
            setUser(response.data.data);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }, []);

    const fetchMaterials = useCallback(async () => {

        try {
            const response = await materialsAPI.getAll();
            setMaterials(response.data.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
        fetchMaterials();
    }, [fetchUser, fetchMaterials]);

    // Filter materials for students
    const assignedMaterials = user?.role === 'student'
        ? materials.filter(m => m.assignedTo && m.assignedTo.includes(user._id))
        : [];

    const myMaterials = materials.filter(m => m.user === user?._id);
    const otherMaterials = materials.filter(m =>
        m.user !== user?._id &&
        (!m.assignedTo || !m.assignedTo.includes(user?._id))
    );

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        uploadData.append('title', formData.title);
        uploadData.append('subject', formData.subject);
        uploadData.append('topic', formData.topic);
        uploadData.append('difficulty', formData.difficulty);

        try {
            await materialsAPI.create(uploadData);
            toast.success('Material uploaded successfully!');
            setShowUploadModal(false);
            setFormData({ title: '', subject: '', topic: '', difficulty: 'intermediate' });
            setSelectedFile(null);
            fetchMaterials();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload material');
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        try {
            toast.loading('Generating quiz...', { id: 'quiz-gen' });
            const response = await aiAPI.generateQuestions({
                materialId: selectedMaterial._id,
                difficulty: quizSettings.difficulty,
                count: parseInt(quizSettings.count),
                type: 'multiple-choice'
            });
            toast.success('Quiz generated!', { id: 'quiz-gen' });
            setShowQuizModal(false);
            navigate(`/quiz/${response.data.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate quiz', { id: 'quiz-gen' });
        }
    };

    const handleSummarize = async (materialId) => {
        try {
            toast.loading('Generating summary...', { id: 'summary' });
            const response = await materialsAPI.summarize(materialId, { length: 'medium' });
            toast.success('Summary generated!', { id: 'summary' });
            fetchMaterials();

            // Show summary in modal
            const material = materials.find(m => m._id === materialId);
            setSelectedMaterial({ ...material, summary: response.data.data.summary });
            setShowSummaryModal(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate summary', { id: 'summary' });
        }
    };

    const handleGenerateFlashcards = async (materialId) => {
        try {
            toast.loading('Generating flashcards...', { id: 'flashcards' });
            await materialsAPI.generateFlashcards(materialId, { count: 10 });
            toast.success('Flashcards generated!', { id: 'flashcards' });
            fetchMaterials();

            // Fetch updated material to show flashcards
            const response = await materialsAPI.getOne(materialId);
            setSelectedMaterial(response.data.data);
            setShowFlashcardsModal(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate flashcards', { id: 'flashcards' });
        }
    };

    const renderMaterialCard = (material, isAssigned = false) => (
        <div key={material._id} className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 ${isAssigned ? 'border-2 border-indigo-500 dark:border-indigo-400' : ''}`}>
            {isAssigned && (
                <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Assigned by Instructor</span>
                </div>
            )}
            <div className="flex items-start gap-3 mb-4">
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {material.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white">{material.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{material.topic}</p>
                </div>
            </div>

            <div className="mb-4 flex gap-2 flex-wrap">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${material.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    material.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {material.difficulty}
                </span>
                {material.summary && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Has Summary
                    </span>
                )}
                {material.flashcards && material.flashcards.length > 0 && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {material.flashcards.length} Cards
                    </span>
                )}
            </div>

            <div className="space-y-2">
                <button
                    onClick={() => {
                        setSelectedMaterial(material);
                        setShowQuizModal(true);
                    }}
                    className="w-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center gap-2"
                >
                    <Brain className="w-4 h-4" />
                    Generate Quiz
                </button>

                <button
                    onClick={() => material.summary ? (setSelectedMaterial(material), setShowSummaryModal(true)) : handleSummarize(material._id)}
                    className="w-full bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center gap-2"
                >
                    {material.summary ? <Eye className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    {material.summary ? 'View Summary' : 'Generate Summary'}
                </button>

                <button
                    onClick={() => material.flashcards?.length > 0 ? (setSelectedMaterial(material), setShowFlashcardsModal(true)) : handleGenerateFlashcards(material._id)}
                    className="w-full bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 px-4 py-2 rounded-lg font-medium hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors flex items-center justify-center gap-2"
                >
                    {material.flashcards?.length > 0 ? <Eye className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    {material.flashcards?.length > 0 ? 'View Flashcards' : 'Generate Flashcards'}
                </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-300">
                    Uploaded {new Date(material.createdAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Materials</h1>
                    <p className="text-gray-600 dark:text-white mt-2">Upload and manage your study materials</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Upload className="w-5 h-5" />
                    Upload Material
                </button>
            </div>

            {/* Assigned Materials Section (Students Only) */}
            {user?.role === 'student' && assignedMaterials.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                        Assigned to You
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignedMaterials.map((material) => renderMaterialCard(material, true))}
                    </div>
                </div>
            )}

            {/* My Materials */}
            {myMaterials.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Materials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myMaterials.map((material) => renderMaterialCard(material))}
                    </div>
                </div>
            )}

            {/* All Materials */}
            {materials.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
                    <Upload className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No materials yet</h2>
                    <p className="text-gray-600 dark:text-white mb-6">Upload your first study material to get started</p>
                </div>
            ) : otherMaterials.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">All Materials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherMaterials.map((material) => renderMaterialCard(material))}
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Study Material</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Select File (PDF, Image, or Text)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png,.txt"
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                        <FileText className="w-12 h-12 text-gray-400 dark:text-gray-300 mb-2" />
                                        {selectedFile ? (
                                            <p className="text-sm text-gray-600 dark:text-white">
                                                Selected: <span className="font-semibold text-gray-900 dark:text-white">{selectedFile.name}</span>
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-600 dark:text-white">Click to select a file</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-300 mt-1">PDF, JPG, PNG, or TXT (Max 10MB)</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Calculus Chapter 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Subject *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g., Mathematics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Topic *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    placeholder="e.g., Limits and Continuity"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Difficulty Level</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quiz Settings Modal */}
            {showQuizModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Settings</h2>
                            <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                                    Number of Questions
                                </label>
                                <input
                                    type="number"
                                    min="3"
                                    max="20"
                                    value={quizSettings.count}
                                    onChange={(e) => setQuizSettings({ ...quizSettings, count: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-black dark:text-white mt-1">Each question is worth {100 / quizSettings.count}% of total marks</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-2">
                                    Difficulty Level
                                </label>
                                <select
                                    value={quizSettings.difficulty}
                                    onChange={(e) => setQuizSettings({ ...quizSettings, difficulty: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Quiz Summary</h3>
                                <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
                                    <li>• {quizSettings.count} questions</li>
                                    <li>• {quizSettings.difficulty} difficulty</li>
                                    <li>• Passing score: 70%</li>
                                    <li>• Can reattempt if failed</li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowQuizModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerateQuiz}
                                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Generate Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSummaryModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="summary-title"
                    onClick={() => setShowSummaryModal(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2
                                id="summary-title"
                                className="text-2xl font-bold text-gray-900 dark:text-white"
                            >
                                AI Summary
                            </h2>
                            <button
                                onClick={() => setShowSummaryModal(false)}
                                aria-label="Close summary"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="prose max-w-none text-gray-900 dark:text-white whitespace-pre-wrap">
                            {selectedMaterial?.summary ? (
                                selectedMaterial.summary
                            ) : (
                                <p className="text-gray-500 italic">No summary available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Flashcards Modal */}
            {showFlashcardsModal && selectedMaterial?.flashcards && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards ({selectedMaterial.flashcards.length})</h2>
                            <button onClick={() => setShowFlashcardsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedMaterial.flashcards.map((card, index) => (
                                <div
                                    key={index}
                                    onClick={() => setFlippedModalCards(prev => ({ ...prev, [index]: !prev[index] }))}
                                    className="cursor-pointer perspective-1000 h-64 group"
                                >
                                    <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flippedModalCards[index] ? 'rotate-y-180' : ''
                                        }`}>
                                        {/* Front */}
                                        <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col items-center justify-center text-center">
                                            <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-4">Question</span>
                                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                {card.question}
                                            </p>
                                            <p className="mt-4 text-xs text-gray-400 dark:text-gray-300">Click to flip</p>
                                        </div>

                                        {/* Back */}
                                        <div className="absolute w-full h-full backface-hidden bg-indigo-600 rounded-xl p-6 shadow-lg rotate-y-180 flex flex-col items-center justify-center text-center text-white">
                                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-4">Answer</span>
                                            <p className="text-lg font-medium">
                                                {card.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <style jsx>{`
                            .perspective-1000 { perspective: 1000px; }
                            .transform-style-3d { transform-style: preserve-3d; }
                            .backface-hidden { backface-visibility: hidden; }
                            .rotate-y-180 { transform: rotateY(180deg); }
                        `}</style>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Materials;
