import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../utils/api';
import { Trophy, Medal, Crown, Star, TrendingUp, Shield } from 'lucide-react';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(0);
    const [userXP, setUserXP] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await analyticsAPI.getLeaderboard();
            const { leaderboard, userRank, userXP, userLevel } = res.data.data;
            setLeaderboard(leaderboard);
            setUserRank(userRank);
            setUserXP(userXP);
            setUserLevel(userLevel);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const topThree = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    Leaderboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Compete with peers and earn XP!</p>
            </div>

            {/* My Stats Banner */}
            <div className="bg-indigo-600 dark:bg-indigo-900/50 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                        <Star className="w-8 h-8 text-yellow-300" />
                    </div>
                    <div>
                        <p className="text-indigo-100 font-medium">Your Current Rank</p>
                        <p className="text-3xl font-bold">#{userRank}</p>
                    </div>
                </div>
                <div className="h-px w-full md:w-px md:h-12 bg-indigo-400/50 my-4 md:my-0"></div>
                <div className="text-center">
                    <p className="text-indigo-100 font-medium">Level</p>
                    <p className="text-3xl font-bold">{userLevel}</p>
                </div>
                <div className="h-px w-full md:w-px md:h-12 bg-indigo-400/50 my-4 md:my-0"></div>
                <div className="text-center">
                    <p className="text-indigo-100 font-medium">Total XP</p>
                    <p className="text-3xl font-bold">{userXP}</p>
                </div>
            </div>

            {/* Top 3 Podium */}
            {topThree.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* Rank 2 */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-b-4 border-gray-300 flex flex-col items-center order-2 md:order-1 transform hover:-translate-y-2 transition-transform">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
                                {topThree[1].name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-gray-300 rounded-full p-2 border-4 border-white dark:border-gray-800">
                                <span className="font-bold text-gray-700">2</span>
                            </div>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white truncate max-w-full text-center">{topThree[1].name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Level {topThree[1].level}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-2">{topThree[1].xp} XP</p>
                    </div>

                    {/* Rank 1 */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-b-4 border-yellow-400 flex flex-col items-center order-1 md:order-2 z-10 scale-110 transform hover:-translate-y-2 transition-transform">
                        <div className="relative">
                            <Crown className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-10 h-10 text-yellow-500 animate-bounce" />
                            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-yellow-600">
                                {topThree[0].name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2 border-4 border-white dark:border-gray-800">
                                <span className="font-bold text-white">1</span>
                            </div>
                        </div>
                        <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white truncate max-w-full text-center">{topThree[0].name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Level {topThree[0].level}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 text-xl">{topThree[0].xp} XP</p>
                    </div>

                    {/* Rank 3 */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-b-4 border-orange-300 flex flex-col items-center order-3 transform hover:-translate-y-2 transition-transform">
                        <div className="relative">
                            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-2xl font-bold text-orange-600">
                                {topThree[2].name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-orange-300 rounded-full p-2 border-4 border-white dark:border-gray-800">
                                <span className="font-bold text-orange-800">3</span>
                            </div>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white truncate max-w-full text-center">{topThree[2].name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Level {topThree[2].level}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-2">{topThree[2].xp} XP</p>
                    </div>
                </div>
            )}

            {/* Fallback Podium if < 3 users */}
            {topThree.length > 0 && topThree.length < 3 && (
                <div className="flex justify-center gap-4">
                    {topThree.map((user, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-b-4 border-indigo-200 flex flex-col items-center min-w-[200px]">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
                            <p className="text-indigo-600 dark:text-indigo-400 font-bold">{user.xp} XP</p>
                        </div>
                    ))}
                </div>
            )}


            {/* List for Others */}
            {others.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Up and Coming
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {others.map((user, index) => (
                            <div key={user._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-400 font-bold w-6">#{index + 4}</span>
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-gray-500">Level {user.level}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 dark:text-white">{user.xp}</p>
                                    <p className="text-xs text-gray-400">XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {leaderboard.length === 0 && (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-500">No data available yet.</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
