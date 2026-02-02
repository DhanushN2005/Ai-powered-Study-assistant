import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, LayoutDashboard, FileText, Calendar, BarChart3, User, LogOut, Users, Upload, Brain, Sun, Moon, Trophy, Menu, X, MessageSquare, ChevronLeft, ChevronRight, GraduationCap, School } from 'lucide-react';
import { authAPI } from '../utils/api';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const fetchUser = async () => {
        try {
            const response = await authAPI.getProfile();
            setUser(response.data.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Student navigation items
    const studentNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Materials', path: '/materials', icon: FileText },
        { name: 'Assignments', path: '/assignments', icon: Brain },
        { name: 'Discussions', path: '/discussions', icon: MessageSquare },
        { name: 'Scheduler', path: '/scheduler', icon: Calendar },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    // Instructor navigation items
    const instructorNavItems = [
        { name: 'Dashboard', path: '/instructor', icon: Users },
        { name: 'Materials', path: '/instructor/materials', icon: Upload },
        { name: 'Discussions', path: '/discussions', icon: MessageSquare },
        { name: 'Scheduler', path: '/scheduler', icon: Calendar },
        { name: 'Analytics', path: '/instructor/analytics', icon: BarChart3 },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    const navItems = user?.role === 'instructor' ? instructorNavItems : studentNavItems;

    const isActive = (path) => {
        return location.pathname === path;
    };

    const SidebarContent = () => (
        <>
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400 transition-opacity duration-300 animate-fade-in">
                        <BookOpen className="w-8 h-8" />
                        <span>AI Study</span>
                    </div>
                )}
                {isCollapsed && <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Toggle Button (Desktop Only) */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-50 text-gray-500 dark:text-gray-400"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {user && (
                <div className={`mx-6 p-3 bg-indigo-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 ${isCollapsed ? 'mx-2 p-2 flex justify-center' : ''}`}>
                    {isCollapsed ? (
                        <div title={user.name} className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                            {user.name.charAt(0)}
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold uppercase flex items-center gap-1">
                                {user.role === 'instructor' ? <School className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                                {user.role === 'instructor' ? 'Instructor' : 'Student'}
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                                {user.name}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <nav className="mt-6 flex-1 px-4 space-y-2 overflow-x-hidden">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group overflow-hidden ${isActive(item.path)
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700/50'
                            }`}
                        title={isCollapsed ? item.name : ''}
                    >
                        {isActive(item.path) && (
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <item.icon className={`w-5 h-5 min-w-[20px] transition-transform group-hover:scale-110 duration-200`} />
                        {!isCollapsed && <span className="font-medium whitespace-nowrap animate-fade-in">{item.name}</span>}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                                {item.name}
                            </div>
                        )}
                    </Link>
                ))}
            </nav>

            <div className={`p-4 border-t border-gray-100 dark:border-gray-700 mt-auto flex items-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 ${isCollapsed ? 'flex-col gap-4 justify-center' : 'justify-between'}`}>
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    title={theme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'}
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                {!isCollapsed && <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>}

                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-semibold text-sm ${isCollapsed ? '' : 'flex-1'}`}
                    title="Logout"
                >
                    {!isCollapsed && <span>Logout</span>}
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen transition-colors duration-200">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-6 h-6" />
                    <span>AI Study</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
            </div>

            {/* Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop & Mobile Drawer) */}
            <aside
                className={`
                    fixed md:relative inset-y-0 left-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl md:shadow-none border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-in-out flex flex-col
                    ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
                    ${isCollapsed ? 'md:w-20' : 'md:w-64'}
                `}
            >
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 scroll-smooth">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
