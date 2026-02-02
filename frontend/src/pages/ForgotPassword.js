import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/forgotpassword', { email });
            setEmailSent(true);
            toast.success('Email sent successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send email');
            setEmailSent(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-colors">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 text-3xl font-bold text-indigo-600 mb-2">
                        <BookOpen className="w-10 h-10" />
                        <span>AI Study Assistant</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">Reset Password</h2>
                </div>

                {emailSent ? (
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                            <Mail className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Check your email</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            We have sent a password reset link to <span className="font-semibold">{email}</span>
                        </p>
                        <button
                            onClick={() => setEmailSent(false)}
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                            Try another email?
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <p className="text-center mt-6 text-gray-600 dark:text-white">
                    Remember your password?{' '}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
