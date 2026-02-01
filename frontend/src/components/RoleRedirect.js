import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Loader } from 'lucide-react';

const RoleRedirect = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await authAPI.getProfile();
            setUser(response.data.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Redirect based on role
    if (user?.role === 'instructor') {
        return <Navigate to="/instructor" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

export default RoleRedirect;
