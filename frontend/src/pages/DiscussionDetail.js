import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Eye, CheckCircle, Send, Award, Bot } from 'lucide-react';
import { discussionAPI, authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const DiscussionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchDiscussion = useCallback(async () => {
        try {
            setLoading(true);
            const response = await discussionAPI.getOne(id);
            setDiscussion(response.data.data);
        } catch (error) {
            toast.error('Failed to load discussion');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCurrentUser();
        fetchDiscussion();
    }, [id, fetchDiscussion]);

    const fetchCurrentUser = async () => {
        try {
            const response = await authAPI.getProfile();
            setCurrentUser(response.data.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const handleAddReply = async (e) => {
        e.preventDefault();

        if (!replyContent.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        try {
            setSubmitting(true);
            await discussionAPI.addReply(id, replyContent);
            toast.success('Reply added successfully!');
            setReplyContent('');
            fetchDiscussion();
        } catch (error) {
            toast.error('Failed to add reply');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpvote = async () => {
        try {
            await discussionAPI.upvote(id);
            fetchDiscussion();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpvoteReply = async (replyId) => {
        try {
            await discussionAPI.upvoteReply(id, replyId);
            fetchDiscussion();
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAsAnswer = async (replyId) => {
        try {
            await discussionAPI.markAsAnswer(id, replyId);
            toast.success('Marked as answer!');
            fetchDiscussion();
        } catch (error) {
            toast.error('Failed to mark as answer');
            console.error(error);
        }
    };

    const handleAskAI = async () => {
        try {
            setSubmitting(true);
            toast.loading('AI is analyzing the question...', { id: 'ai-loading' });

            const response = await discussionAPI.askAI(id);
            const aiAnswer = response.data.data.answer;

            setReplyContent((prev) => {
                const prefix = prev ? prev + '\n\n' : '';
                return prefix + `🤖 **AI Assistant Answer:**\n\n${aiAnswer}`;
            });

            toast.success('AI answer generated!', { id: 'ai-loading' });
        } catch (error) {
            toast.error('Failed to get AI answer', { id: 'ai-loading' });
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Discussion not found</p>
            </div>
        );
    }

    const canMarkAsAnswer = currentUser && (
        discussion.user._id === currentUser._id ||
        currentUser.role === 'instructor'
    );

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/discussions')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Discussions
            </button>

            {/* Discussion Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
                {/* Header */}
                <div className="flex items-start gap-6 mb-6">
                    {/* Upvote Section */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleUpvote}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ThumbsUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {discussion.upvoteCount || 0}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {discussion.title}
                        </h1>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(discussion.status)}`}>
                                {discussion.status === 'answered' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                                {discussion.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(discussion.difficulty)}`}>
                                {discussion.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Eye className="w-4 h-4" />
                                {discussion.views} views
                            </span>
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <MessageCircle className="w-4 h-4" />
                                {discussion.replyCount || 0} replies
                            </span>
                        </div>

                        {/* Tags */}
                        {discussion.tags && discussion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {discussion.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Subject/Topic */}
                        <div className="flex gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">{discussion.subject}</span>
                            {discussion.topic && (
                                <>
                                    <span>•</span>
                                    <span>{discussion.topic}</span>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="prose dark:prose-invert max-w-none mb-4">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {discussion.content}
                            </p>
                        </div>

                        {/* Author Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {discussion.user?.name}
                            </span>
                            {discussion.user?.role === 'instructor' && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs rounded-full">
                                    Instructor
                                </span>
                            )}
                            <span>•</span>
                            <span>Asked {new Date(discussion.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Replies Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {discussion.replies?.length || 0} {discussion.replies?.length === 1 ? 'Reply' : 'Replies'}
                </h2>

                {/* Replies List */}
                <div className="space-y-6 mb-8">
                    {discussion.replies && discussion.replies.length > 0 ? (
                        discussion.replies.map((reply) => (
                            <div
                                key={reply._id}
                                className={`border-l-4 pl-6 py-4 ${reply.isAnswer
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                    : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Upvote */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => handleUpvoteReply(reply._id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <ThumbsUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {reply.upvotes?.length || 0}
                                        </span>
                                    </div>

                                    {/* Reply Content */}
                                    <div className="flex-1">
                                        {reply.isAnswer && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                    Accepted Answer
                                                </span>
                                            </div>
                                        )}

                                        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                                            {reply.content}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {reply.user?.name}
                                                </span>
                                                {reply.user?.role === 'instructor' && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs rounded-full">
                                                        Instructor
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                            </div>

                                            {canMarkAsAnswer && !reply.isAnswer && (
                                                <button
                                                    onClick={() => handleMarkAsAnswer(reply._id)}
                                                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                                                >
                                                    Mark as Answer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No replies yet. Be the first to help!
                        </p>
                    )}
                </div>

                {/* Add Reply Form */}
                {/* Add Reply Form */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Answer</h3>
                        <button
                            type="button"
                            onClick={handleAskAI}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                        >
                            <Bot className="w-4 h-4" />
                            Ask AI to Answer
                        </button>
                    </div>
                    <form onSubmit={handleAddReply}>
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-4"
                            placeholder="Share your knowledge and help others..."
                        />
                        <button
                            type="submit"
                            disabled={submitting || !replyContent.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                            {submitting ? 'Posting...' : 'Post Reply'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DiscussionDetail;
