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
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] duration-300">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
                            <div className="p-3 bg-blue-600 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-600/30">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>
                        </Link>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                            Create Account
                        </h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Start your learning journey today
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-200 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-200 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-200 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Create a strong password"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-200 ml-1">
                                I am a
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 flex flex-col items-center gap-2 group ${formData.role === 'student' || !formData.role
                                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="student"
                                        checked={formData.role === 'student' || !formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="sr-only"
                                    />
                                    <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">🎓</div>
                                    <span className={`font-semibold ${formData.role === 'student' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                                        }`}>Student</span>
                                </label>

                                <label className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 flex flex-col items-center gap-2 group ${formData.role === 'instructor'
                                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="instructor"
                                        checked={formData.role === 'instructor'}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="sr-only"
                                    />
                                    <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">👨‍🏫</div>
                                    <span className={`font-semibold ${formData.role === 'instructor' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                                        }`}>Instructor</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
