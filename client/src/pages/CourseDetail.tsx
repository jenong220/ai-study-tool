import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courses, materials, quizzes } from '../lib/api';
import { Course, Material, Quiz } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import UploadMaterial from '../components/materials/UploadMaterial';
import MaterialList from '../components/materials/MaterialList';
import QuizConfigModal from '../components/quiz/QuizConfigModal';
import QuizHistory from '../components/quiz/QuizHistory';
import { useAuthStore } from '../stores/authStore';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isGuest, logout } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [quizHistory, setQuizHistory] = useState<Quiz[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCourse();
      loadMaterials();
      loadQuizHistory();
    }
  }, [id]);

  const loadCourse = async () => {
    try {
      const response = await courses.getById(id!);
      setCourse(response.data);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materials.getAll(id!);
      setMaterialsList(response.data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizHistory = async () => {
    try {
      const response = await quizzes.getAllForCourse(id!);
      setQuizHistory(response.data);
    } catch (error) {
      console.error('Failed to load quiz history:', error);
    }
  };

  const handleGenerateQuiz = async (config: any) => {
    // Prevent guest users from generating quizzes
    if (isGuest || !token) {
      alert('Please create an account and log in to generate quizzes.');
      navigate('/register');
      return;
    }

    try {
      const response = await quizzes.generate(id!, config);
      loadQuizHistory(); // Refresh quiz history
      navigate(`/quizzes/${response.data.quiz.id}`);
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      let errorMessage = 'Failed to generate quiz';
      
      if (!error.response) {
        errorMessage = 'Unable to connect to server. Please ensure the backend is running.';
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid quiz configuration';
      } else if (error.response.status === 401 || error.response.status === 403) {
        errorMessage = 'Your session has expired. Please log in again.';
        logout();
        navigate('/login');
      } else if (error.response.status === 404) {
        errorMessage = 'Course not found';
      } else if (error.response.status === 500) {
        errorMessage = error.response.data?.error || 'Server error. Please check if you have materials uploaded and an Anthropic API key configured.';
      } else {
        errorMessage = error.response.data?.error || error.message || 'Failed to generate quiz';
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center">Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: course.color }}
            >
              {course.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-3xl font-bold">{course.name}</h1>
          </div>
          {course.description && <p className="text-gray-600 ml-16">{course.description}</p>}
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={() => setIsUploadOpen(true)}>
            Upload Material
          </Button>
          <Button
            onClick={() => {
              if (isGuest || !token) {
                alert('Please create an account and log in to generate quizzes.');
                navigate('/register');
              } else {
                setIsQuizModalOpen(true);
              }
            }}
            disabled={materialsList.length === 0 || isGuest || !token}
            variant="secondary"
          >
            Generate Quiz
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Materials ({materialsList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <MaterialList
                  materials={materialsList}
                  onDelete={loadMaterials}
                  onUpdate={loadMaterials}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Total Materials</div>
                  <div className="text-2xl font-bold">{materialsList.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Words</div>
                  <div className="text-2xl font-bold">
                    {materialsList.reduce((sum, m) => sum + (m.wordCount || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Quizzes</div>
                  <div className="text-2xl font-bold">{quizHistory.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz History ({quizHistory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <QuizHistory quizzes={quizHistory} />
          </CardContent>
        </Card>

        <UploadMaterial
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          courseId={id!}
          onSuccess={loadMaterials}
        />

        <QuizConfigModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          materials={materialsList}
          onGenerate={handleGenerateQuiz}
        />
      </div>
    </div>
  );
}

