import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Sparkles, Target, Zap, ChevronRight } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500 selection:text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-sm bg-slate-950/50 sticky top-0 border-b border-white/5">
                <div className="flex items-center gap-2 font-bold text-2xl">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        AI Study Assistant
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-slate-300 hover:text-white transition-colors font-medium">Sign In</Link>
                    <Link to="/register" className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 group">
                        Get Started
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-blue-400 mb-8 animate-fade-in-up backdrop-blur-md">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-semibold">Revolutionizing Education with AI</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                    Master Your Studies <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-200 to-emerald-400">
                        with AI Precision
                    </span>
                </h1>

                <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Personalized study plans, intelligent quizzes, and real-time progress tracking tailored just for you. Join thousands of students achieving their goals today.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
                    <Link to="/register" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl hover:shadow-blue-600/30 flex items-center justify-center gap-2 transform hover:-translate-y-1">
                        Start Learning Now
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                    <Link to="/login" className="px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all hover:border-slate-600 backdrop-blur-md">
                        Existing User? Log In
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 text-left">
                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group hover:bg-slate-900 shadow-xl">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                            <Brain className="w-7 h-7 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-100">AI-Powered Planning</h3>
                        <p className="text-slate-400 leading-relaxed">Adaptive schedules that evolve primarily based on your performance and learning pace.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all group hover:bg-slate-900 shadow-xl">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                            <Zap className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-100">Instant Feedback</h3>
                        <p className="text-slate-400 leading-relaxed">Real-time deep analysis of your quizzes to identify strengths and pinpoint weak spots.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all group hover:bg-slate-900 shadow-xl">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:border-purple-500/50 transition-colors">
                            <Target className="w-7 h-7 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-100">Goal Tracking</h3>
                        <p className="text-slate-400 leading-relaxed">Visual analytics and gamification to keep you motivated and on track for your exams.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
