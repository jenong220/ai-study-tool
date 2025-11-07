import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import QuizTake from './pages/QuizTake';
import QuizResults from './pages/QuizResults';
import Analytics from './pages/Analytics';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isGuest } = useAuthStore();
  return token || isGuest ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, isGuest } = useAuthStore();
  return !token && !isGuest ? <>{children}</> : <Navigate to="/dashboard" />;
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    try {
      initialize();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/courses/:id" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
        <Route path="/quizzes/:id" element={<PrivateRoute><QuizTake /></PrivateRoute>} />
        <Route path="/quizzes/:id/results" element={<PrivateRoute><QuizResults /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

