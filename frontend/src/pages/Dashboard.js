import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Calendar,
  Award,
  Flame,
  Clock,
  Target,
  ChevronRight,
  Bell,
  Star,
  AlertCircle,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { analyticsAPI, schedulerAPI, aiAPI, materialsAPI } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5006/api';

export default function Dashboard() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const { data: dashboardData, isLoading } = useQuery(
    ['dashboard'],
    () => analyticsAPI.getDashboard(30).then(res => res.data.data),
    { refetchInterval: 30000 }
  );

  const { data: streak } = useQuery(
    ['streak'],
    () => schedulerAPI.getStreak().then(res => res.data.data),
    { refetchInterval: 60000 }
  );

  const { data: recommendations } = useQuery(
    ['recommendations'],
    () => aiAPI.getRecommendations().then(res => res.data.data),
    { refetchInterval: 300000 }
  );

  // Fetch assigned materials
  const { data: assignedMaterials } = useQuery(
    ['assignedMaterials'],
    async () => {
      const token = localStorage.getItem('token');
      const response = await materialsAPI.getAll();
      const allMaterials = response.data.data;
      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userId = userResponse.data.data._id;
      return allMaterials.filter(m => m.assignedTo && m.assignedTo.includes(userId));
    },
    { refetchInterval: 60000 }
  );

  // Fetch assigned quizzes
  const { data: assignedQuizzes } = useQuery(
    ['assignedQuizzes'],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/quizzes/assigned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
    { refetchInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Brain className="w-6 h-6 text-primary-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const { totals, bySubject, dailyProgress, weakTopics } = dashboardData || {};
  const hasAssignments = (assignedMaterials?.length > 0) || (assignedQuizzes?.length > 0);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-primary-600/10 via-purple-600/10 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            {greeting}, Scholar
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Ready to expand your knowledge today?
          </p>
        </div>

        {/* Assigned Tasks Notification */}
        {hasAssignments && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-1 shadow-lg shadow-indigo-200 dark:shadow-none">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Bell className="w-32 h-32 transform rotate-12" />
                </div>

                <div className="flex items-start gap-6 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Bell className="w-6 h-6 animate-swing" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                        <span className="text-xs text-white font-bold">
                          {(assignedMaterials?.length || 0) + (assignedQuizzes?.length || 0)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      New Assignments
                      <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
                        Action Required
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {assignedMaterials?.length > 0 && (
                        <div className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 transition-all hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                {assignedMaterials.length} Study Material{assignedMaterials.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 truncate max-w-[200px]">
                                {assignedMaterials[0].title}
                                {assignedMaterials.length > 1 && ` +${assignedMaterials.length - 1} more`}
                              </p>
                            </div>
                            <Link to="/materials" className="bg-white dark:bg-gray-900 text-indigo-600 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      )}

                      {assignedQuizzes?.length > 0 && (
                        <div className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 transition-all hover:bg-purple-50 dark:hover:bg-gray-700 hover:border-purple-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-500" />
                                {assignedQuizzes.length} Quiz{assignedQuizzes.length > 1 ? 'zes' : ''}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {assignedQuizzes.some(q => q.dueDate) && (
                                  <span className="flex items-center gap-1 text-red-500 text-xs">
                                    <AlertCircle className="w-3 h-3" /> Due Soon
                                  </span>
                                )}
                              </p>
                            </div>
                            <Link to="/assignments" className="bg-white dark:bg-gray-900 text-purple-600 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group-hover:bg-purple-600 group-hover:text-white transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            icon={Clock}
            title="Study Time"
            value={`${Math.round(totals?.studyTime / 60) || 0}h`}
            subtitle="Last 30 days"
            color="blue"
            delay="0.1s"
            trend="+12%"
          />
          <StatCard
            icon={Brain}
            title="Quizzes"
            value={totals?.quizzesTaken || 0}
            subtitle={`${totals?.sessionsCompleted || 0} sessions`}
            color="green"
            delay="0.2s"
          />
          <StatCard
            icon={Award}
            title="Avg Score"
            value={calculateAvgScore(bySubject) || 'N/A'}
            subtitle="Across subjects"
            color="purple"
            delay="0.3s"
          />
          <StatCard
            icon={Flame}
            title="Streak"
            value={streak?.currentStreak || 0}
            subtitle={`Best: ${streak?.longestStreak || 0}`}
            color="orange"
            delay="0.4s"
            isFire={true}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Chart */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-500" />
                    Learning Activity
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your study consistency over time</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyProgress?.slice(-14)}>
                    <defs>
                      <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="studyTime"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorStudy)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Performance Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Performance by Subject
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(bySubject || {}).map(([subject, stats], idx) => (
                  <SubjectCard key={subject} subject={subject} stats={stats} index={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>

            {/* AI Recommendations */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary-400 to-purple-400 opacity-10 rounded-full blur-2xl" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                AI Smart Tips
              </h2>
              <div className="space-y-4 relative z-10">
                {recommendations?.recommendations?.slice(0, 3).map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </div>
              <Link
                to="/analytics"
                className="mt-6 flex items-center justify-center w-full py-2.5 rounded-lg bg-primary-50 text-primary-600 font-semibold hover:bg-primary-100 transition-colors text-sm"
              >
                View Analytics
                <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            {/* Weak Topics */}
            {weakTopics && weakTopics.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl p-6 border border-orange-100 dark:border-orange-800">
                <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Focus Areas
                </h3>
                <div className="space-y-3">
                  {weakTopics.slice(0, 3).map((topic, index) => (
                    <div key={index} className="bg-white/60 dark:bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{topic.subject}</span>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded-full">{topic.avgAccuracy}%</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{topic.topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <QuickActionRow
                  icon={BookOpen}
                  title="Upload Material"
                  to="/materials"
                  color="blue"
                />
                <QuickActionRow
                  icon={Brain}
                  title="Take New Quiz"
                  to="/materials"
                  color="purple"
                />
                <QuickActionRow
                  icon={Calendar}
                  title="Schedule Plan"
                  to="/scheduler"
                  color="green"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styled Components
function StatCard({ icon: Icon, title, value, subtitle, color, delay, trend, isFire }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    purple: 'from-violet-500 to-violet-600 shadow-violet-200',
    orange: 'from-orange-500 to-orange-600 shadow-orange-200',
  };

  const bgColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-violet-50 text-violet-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${bgColors[color]} dark:bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${isFire ? 'animate-bounce' : ''}`} />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{title}</p>
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

function SubjectCard({ subject, stats }) {
  const percentage = stats.avgAccuracy || 0;
  return (
    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white">{subject}</h3>
        <span className={`text-sm font-bold ${percentage >= 70 ? 'text-emerald-600' : 'text-orange-600'}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${percentage >= 70 ? 'bg-emerald-500' : 'bg-orange-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{Math.round(stats.studyTime / 60)}h studied</span>
        <span>{stats.quizzesTaken} quizzes</span>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }) {
  const priorityStyles = {
    high: 'border-red-500 bg-red-50 text-red-700',
    medium: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    low: 'border-blue-500 bg-blue-50 text-blue-700',
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className={`absolute left-0 top-4 h-8 w-1 rounded-r-full ${priorityStyles[recommendation.priority].split(' ')[0].replace('border', 'bg')}`} />
      <div className="pl-3">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{recommendation.subject || recommendation.type}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${priorityStyles[recommendation.priority].split(' ').slice(1).join(' ')}`}>
            {recommendation.priority}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
          {recommendation.action}
        </p>
      </div>
    </div>
  );
}

function QuickActionRow({ icon: Icon, title, to, color }) {
  const colors = {
    blue: 'text-blue-600 group-hover:bg-blue-600 group-hover:text-white bg-blue-50',
    purple: 'text-purple-600 group-hover:bg-purple-600 group-hover:text-white bg-purple-50',
    green: 'text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white bg-emerald-50',
  };

  return (
    <Link
      to={to}
      className="group flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
    >
      <div className={`p-2.5 rounded-lg mr-4 transition-colors ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name === 'studyTime' ? 'Study Time' : 'Quiz Accuracy'}:
              {entry.name === 'studyTime' ? ` ${entry.value} min` : ` ${entry.value}%`}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function calculateAvgScore(bySubject) {
  if (!bySubject || Object.keys(bySubject).length === 0) return null;

  const scores = Object.values(bySubject).map(s => s.avgAccuracy);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return `${Math.round(avg)}%`;
}
