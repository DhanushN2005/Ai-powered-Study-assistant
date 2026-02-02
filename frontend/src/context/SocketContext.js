import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);

    // Initialize socket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            connect(token);
        }

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
        // eslint-disable-next-line
    }, []);

    const connect = async () => {
        try {
            // Get user details first to join room
            const response = await authAPI.getProfile();
            const userData = response.data.data;
            setUser(userData);

            // Connect to socket
            // Use environment variable or default to window.location.origin if usually same domain, 
            // but for dev we need explicit URL if backend is on 5006
            const SOCKET_URL = process.env.REACT_APP_API_URL
                ? process.env.REACT_APP_API_URL.replace('/api', '')
                : 'http://localhost:5006';

            const newSocket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'] // fallback to polling if needed
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
                // Join user-specific room
                newSocket.emit('join_user_room', userData._id);
            });

            newSocket.on('notification', (data) => {
                // Play notification sound if desired
                const audio = new Audio('/notification.mp3'); // Ensure this file exists or remove
                audio.play().catch(e => console.log('Audio play failed', e));

                // Show toast
                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-indigo-100 dark:border-indigo-900`}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        New Notification
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {data.message}
                                    </p>
                                    {data.discussionId && (
                                        <a
                                            href={`/discussions/${data.discussionId}`}
                                            className="mt-2 block text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            View Discussion
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ), { duration: 5000 });
            });

            setSocket(newSocket);

        } catch (error) {
            console.error('Socket connection failed', error);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, connect, user }}>
            {children}
        </SocketContext.Provider>
    );
};
