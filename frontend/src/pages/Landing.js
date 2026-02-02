import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Sparkles, Target, Zap } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white selection:bg-indigo-500 selection:text-white">
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-2xl">
                    <BookOpen className="w-8 h-8 text-indigo-400" />
                    <span>AI Study Assistant</span>
                </div>
                <div className="space-x-4">
                    <Link to="/login" className="hover:text-indigo-300 transition-colors">Sign In</Link>
                    <Link to="/register" className="bg-indigo-600 px-6 py-2 rounded-full hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/50">
                        Get Started
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-20 text-center">
                <div className="inline-block mb-4 px-4 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 animate-fade-in-up">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="w-4 h-4" />
                        Powering the Future of Learning
                    </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                    Master Your Studies <br /> with AI Precision
                </h1>
                <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Personalized study plans, intelligent quizzes, and real-time progress tracking tailored just for you. join thousands of students achieving their goals today.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                    <Link to="/register" className="px-8 py-4 bg-white text-indigo-900 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-xl">
                        Start Learning Now
                    </Link>
                    <Link to="/login" className="px-8 py-4 bg-transparent border border-gray-600 rounded-lg font-semibold hover:border-gray-400 hover:bg-white/5 transition-all">
                        Existing User? Log In
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 text-left">
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-6">
                            <Brain className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">AI-Powered Planning</h3>
                        <p className="text-gray-400">Adaptive schedules that evolve with your learning pace and performance.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Instant Feedback</h3>
                        <p className="text-gray-400">Real-time analysis of your quizzes to identify strengths and weak spots.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
                            <Target className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Goal Tracking</h3>
                        <p className="text-gray-400">Visual analytics to keep you motivated and on track for your exams.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
