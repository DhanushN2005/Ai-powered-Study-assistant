import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../utils/api';
import { Trophy, Crown, Star, TrendingUp } from 'lucide-react';

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative py-10">
                    {/* Rank 2 */}
                    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center order-2 md:order-1 transform hover:-translate-y-2 transition-all duration-300 relative group">
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 shadow-inner">
                                {topThree[1].name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-3 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                2
                            </div>
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white truncate max-w-full text-center">{topThree[1].name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider mt-1">Level {topThree[1].level}</p>
                        <div className="mt-3 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <p className="text-indigo-600 dark:text-indigo-400 font-bold">{topThree[1].xp} XP</p>
                        </div>
                    </div>

                    {/* Rank 1 */}
                    <div className="bg-gradient-to-b from-yellow-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-yellow-200 dark:border-yellow-900/50 flex flex-col items-center order-1 md:order-2 z-10 scale-110 transform hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50" />
                        <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-10 transition-opacity" />

                        <div className="relative mb-2">
                            <Crown className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-12 h-12 text-yellow-500 animate-bounce drop-shadow-md" strokeWidth={2.5} />
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-900/40 dark:to-yellow-700/40 rounded-full flex items-center justify-center text-4xl font-bold text-yellow-700 dark:text-yellow-400 shadow-inner ring-4 ring-yellow-50 dark:ring-gray-800">
                                {topThree[0].name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold ring-4 ring-white dark:ring-gray-800 shadow-lg text-lg">
                                1
                            </div>
                        </div>
                        <h3 className="mt-6 text-xl font-black text-gray-900 dark:text-white truncate max-w-full text-center tracking-tight">{topThree[0].name}</h3>
                        <p className="text-yellow-600 dark:text-yellow-500 text-xs uppercase font-bold tracking-wider mt-1">Level {topThree[0].level}</p>
                        <div className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
                            <p className="text-yellow-800 dark:text-yellow-400 font-black text-xl">{topThree[0].xp} XP</p>
                        </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center order-3 transform hover:-translate-y-2 transition-all duration-300 relative group">
                        <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/10 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-700/40 rounded-full flex items-center justify-center text-3xl font-bold text-orange-600 shadow-inner">
                                {topThree[2].name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-3 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                3
                            </div>
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white truncate max-w-full text-center">{topThree[2].name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider mt-1">Level {topThree[2].level}</p>
                        <div className="mt-3 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <p className="text-indigo-600 dark:text-indigo-400 font-bold">{topThree[2].xp} XP</p>
                        </div>
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
