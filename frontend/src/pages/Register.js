import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        subjects: [],
        role: 'student'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/register', formData);
            localStorage.setItem('token', response.data.token);
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
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
                    <p className="text-gray-600 dark:text-white">Create your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            I am a
                        </label>
                        <div className="flex gap-4">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={formData.role === 'student' || !formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="sr-only"
                                />
                                <div className={`border-2 rounded-lg p-4 text-center transition-all ${formData.role === 'student' || !formData.role
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-300 hover:border-indigo-300'
                                    }`}>
                                    <div className="text-2xl mb-2">🎓</div>
                                    <div className="font-semibold text-gray-900">Student</div>
                                    <div className="text-xs text-gray-600 mt-1">Learn and practice</div>
                                </div>
                            </label>
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="instructor"
                                    checked={formData.role === 'instructor'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="sr-only"
                                />
                                <div className={`border-2 rounded-lg p-4 text-center transition-all ${formData.role === 'instructor'
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-300 hover:border-indigo-300'
                                    }`}>
                                    <div className="text-2xl mb-2">👨‍🏫</div>
                                    <div className="font-semibold text-gray-900">Instructor</div>
                                    <div className="text-xs text-gray-600 mt-1">Teach and manage</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-6 text-gray-600 dark:text-white">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
