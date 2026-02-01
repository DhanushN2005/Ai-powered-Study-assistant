import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';
import Scheduler from './pages/Scheduler';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorMaterials from './pages/InstructorMaterials';
import InstructorAnalytics from './pages/InstructorAnalytics';
import Assignments from './pages/Assignments';
import Leaderboard from './pages/Leaderboard';
import Discussions from './pages/Discussions';
import DiscussionDetail from './pages/DiscussionDetail';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import RoleRedirect from './components/RoleRedirect';
import { ThemeProvider } from './context/ThemeContext';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<RoleRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="materials" element={<Materials />} />
                <Route path="materials/:id" element={<MaterialDetail />} />
                <Route path="quiz/:id" element={<Quiz />} />
                <Route path="quiz/:id/results" element={<QuizResults />} />
                <Route path="assigned-quizzes" element={<Assignments />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="scheduler" element={<Scheduler />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="discussions" element={<Discussions />} />
                <Route path="discussions/:id" element={<DiscussionDetail />} />
                <Route path="profile" element={<Profile />} />

                {/* Instructor routes */}
                <Route path="instructor" element={<InstructorDashboard />} />
                <Route path="instructor/materials" element={<InstructorMaterials />} />
                <Route path="instructor/analytics" element={<InstructorAnalytics />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
