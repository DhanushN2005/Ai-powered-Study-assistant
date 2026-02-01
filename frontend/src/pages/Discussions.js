import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, ThumbsUp, MessageCircle, Eye, CheckCircle, Filter, Search, TrendingUp, Clock } from 'lucide-react';
import { discussionAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Discussions = () => {
    const navigate = useNavigate();
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filters, setFilters] = useState({
        subject: '',
        status: '',
        sort: '-createdAt'
    });
    const [searchTerm, setSearchTerm] = useState('');

    const [newDiscussion, setNewDiscussion] = useState({
        subject: '',
        topic: '',
        title: '',
        content: '',
        tags: '',
        difficulty: 'medium'
    });

    useEffect(() => {
        fetchDiscussions();
    }, [filters]);

    const fetchDiscussions = async () => {
        try {
            setLoading(true);
            const response = await discussionAPI.getAll(filters);
            setDiscussions(response.data.data);
        } catch (error) {
            toast.error('Failed to load discussions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDiscussion = async (e) => {
        e.preventDefault();

        if (!newDiscussion.subject || !newDiscussion.title || !newDiscussion.content) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const tagsArray = newDiscussion.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);

            await discussionAPI.create({
                ...newDiscussion,
                tags: tagsArray
            });

            toast.success('Discussion created successfully!');
            setShowCreateModal(false);
            setNewDiscussion({
                subject: '',
                topic: '',
                title: '',
                content: '',
                tags: '',
                difficulty: 'medium'
            });
            fetchDiscussions();
        } catch (error) {
            toast.error('Failed to create discussion');
            console.error(error);
        }
    };

    const handleUpvote = async (id) => {
        try {
            await discussionAPI.upvote(id);
            fetchDiscussions();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredDiscussions = discussions.filter(discussion =>
        discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        discussion.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'answered':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'open':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
            case 'closed':
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'medium':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
            case 'hard':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discussions</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Ask questions and help your peers</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Discussion
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="answered">Answered</option>
                        <option value="closed">Closed</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={filters.sort}
                        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="-createdAt">Latest</option>
                        <option value="createdAt">Oldest</option>
                        <option value="-upvotes">Most Upvoted</option>
                        <option value="-views">Most Viewed</option>
                    </select>
                </div>
            </div>

            {/* Discussions List */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredDiscussions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center transition-colors">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No discussions yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Be the first to start a discussion!</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create Discussion
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredDiscussions.map((discussion) => (
                        <div
                            key={discussion._id}
                            onClick={() => navigate(`/discussions/${discussion._id}`)}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-indigo-300 dark:hover:border-indigo-600"
                        >
                            <div className="flex items-start gap-4">
                                {/* Upvote Section */}
                                <div className="flex flex-col items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpvote(discussion._id);
                                        }}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <ThumbsUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {discussion.upvoteCount || 0}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {discussion.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {discussion.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {discussion.tags && discussion.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {discussion.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-4 h-4" />
                                            {discussion.replyCount || 0} replies
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            {discussion.views || 0} views
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(discussion.status)}`}>
                                            {discussion.status === 'answered' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                            {discussion.status}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(discussion.difficulty)}`}>
                                            {discussion.difficulty}
                                        </span>
                                        <span className="ml-auto">
                                            by {discussion.user?.name || 'Unknown'} • {new Date(discussion.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Discussion Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Discussion</h2>

                            <form onSubmit={handleCreateDiscussion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newDiscussion.subject}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, subject: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., Mathematics, Physics, Computer Science"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Topic (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newDiscussion.topic}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, topic: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="e.g., Calculus, Quantum Mechanics, Data Structures"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newDiscussion.title}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="What's your question?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        required
                                        value={newDiscussion.content}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Provide details about your question..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Difficulty
                                        </label>
                                        <select
                                            value={newDiscussion.difficulty}
                                            onChange={(e) => setNewDiscussion({ ...newDiscussion, difficulty: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tags (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={newDiscussion.tags}
                                            onChange={(e) => setNewDiscussion({ ...newDiscussion, tags: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="homework, exam, concept"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        Create Discussion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discussions;
