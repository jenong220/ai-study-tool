import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analytics } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Analytics() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await analytics.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading analytics...</div>;
  }

  const totals = summary?.totals || {
    questionsAnswered: 0,
    correctAnswers: 0,
    quizAttempts: 0,
    studyTimeSeconds: 0,
  };

  const accuracy = totals.questionsAnswered > 0
    ? ((totals.correctAnswers / totals.questionsAnswered) * 100).toFixed(1)
    : 0;

  const studyHours = (totals.studyTimeSeconds / 3600).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.questionsAnswered}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Correct Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.correctAnswers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{accuracy}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studyHours}h</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.daily && summary.daily.length > 0 ? (
              <div className="space-y-4">
                {summary.daily.slice(0, 10).map((day: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{day.course?.name || 'Unknown Course'}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(day.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {day.correctAnswers} / {day.questionsAnswered}
                      </div>
                      <div className="text-sm text-gray-500">
                        {day.masteryPercentage?.toFixed(1)}% mastery
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No activity yet. Complete some quizzes to see analytics!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

