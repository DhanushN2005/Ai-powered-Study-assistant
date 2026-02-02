import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Target, Clock, Save, Loader, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        subjects: [],
        studyGoals: {
            dailyStudyTime: 120,
            weeklyQuizzes: 5
        }
    });
    const [newSubject, setNewSubject] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            setProfile(response.data.data);
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await authAPI.updateProfile(profile);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await authAPI.deleteAccount();
                toast.success('Account deleted successfully');
                localStorage.removeItem('token');
                window.location.href = '/login';
            } catch (error) {
                toast.error('Failed to delete account');
            }
        }
    };

    const addSubject = () => {
        if (newSubject.trim() && !profile.subjects.includes(newSubject.trim())) {
            setProfile({
                ...profile,
                subjects: [...profile.subjects, newSubject.trim()]
            });
            setNewSubject('');
        }
    };

    const removeSubject = (subject) => {
        setProfile({
            ...profile,
            subjects: profile.subjects.filter(s => s !== subject)
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                <p className="text-gray-600 dark:text-white mt-2">Manage your account and study preferences</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Personal Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300" />
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-white cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Email cannot be changed</p>
                        </div>
                    </div>
                </div>

                {/* Study Subjects */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Study Subjects
                    </h2>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Add a subject (e.g., Mathematics)"
                            />
                            <button
                                type="button"
                                onClick={addSubject}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {profile.subjects && profile.subjects.length > 0 ? (
                                profile.subjects.map((subject, index) => (
                                    <div
                                        key={index}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full"
                                    >
                                        <span>{subject}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSubject(subject)}
                                            className="hover:text-indigo-900 dark:hover:text-indigo-200"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-white text-sm">No subjects added yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Study Goals */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Study Goals
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Daily Study Time (minutes)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="30"
                                    max="480"
                                    step="30"
                                    value={profile.studyGoals?.dailyStudyTime || 120}
                                    onChange={(e) => setProfile({
                                        ...profile,
                                        studyGoals: { ...profile.studyGoals, dailyStudyTime: parseInt(e.target.value) }
                                    })}
                                    className="flex-1"
                                />
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {Math.floor((profile.studyGoals?.dailyStudyTime || 120) / 60)}h {(profile.studyGoals?.dailyStudyTime || 120) % 60}m
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Weekly Quiz Target
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={profile.studyGoals?.weeklyQuizzes || 5}
                                onChange={(e) => setProfile({
                                    ...profile,
                                    studyGoals: { ...profile.studyGoals, weeklyQuizzes: parseInt(e.target.value) }
                                })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                                Number of quizzes you aim to complete each week
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-12 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Delete your account</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
