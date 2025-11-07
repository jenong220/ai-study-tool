import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { courses } from '../lib/api';
import { Course } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import CreateCourseModal from '../components/courses/CreateCourseModal';

export default function Dashboard() {
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuthStore();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    if (isGuest) {
      setLoading(false);
      return; // Guest mode - no API calls
    }
    try {
      const response = await courses.getAll();
      setCourseList(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Study Tool</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                logout();
                navigate('/register');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {isGuest && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Guest Mode:</strong> You're browsing as a guest. Some features may be limited. 
              <Button 
                type="button"
                variant="link" 
                className="p-0 h-auto ml-1 text-blue-800 underline"
                onClick={() => navigate('/register')}
              >
                Create an account
              </Button>
              to save your work.
            </p>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">My Courses</h2>
            <Button 
              type="button"
              onClick={() => {
                if (isGuest) {
                  navigate('/register');
                } else {
                  setIsModalOpen(true);
                }
              }}
              disabled={courseList.length >= 15 && !isGuest}
            >
            {courseList.length >= 15 ? 'Max Courses Reached' : isGuest ? 'Sign up to create courses' : 'Create Course'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : isGuest ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Guest mode is active. Create an account to save courses and materials.</p>
            <Button type="button" onClick={() => navigate('/register')}>Create Account</Button>
          </div>
        ) : courseList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No courses yet. Create your first course to get started!</p>
            <Button onClick={() => setIsModalOpen(true)}>Create Course</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseList.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: course.color }}
                    >
                      {course.name.charAt(0).toUpperCase()}
                    </div>
                    <CardTitle className="text-xl">{course.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{course.description || 'No description'}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{course._count?.materials || 0} materials</span>
                    <span>{course._count?.quizzes || 0} quizzes</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateCourseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadCourses}
        />
      </div>
    </div>
  );
}

