import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { Target, CheckCircle, BookOpen, Clock, Flame, PlayCircle, BarChart3, Zap, Trophy, TrendingUp, Star } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserStats } from "@/lib/api-functions";

export default function Dashboard() {
  const [showStats, setShowStats] = useState(false);

  // Static dashboard data - no database calls needed
  const stats = {
    totalQuestionsSolved: 1247,
    totalCorrectAnswers: 1098,
    studyStreak: 12,
    totalStudyTimeMinutes: 850
  };

  const accuracy = Math.round((stats.totalCorrectAnswers / stats.totalQuestionsSolved) * 100);
  const studyTimeHours = Math.round((stats.totalStudyTimeMinutes / 60) * 10) / 10;

  // Get real quiz stats from direct function call
  const { data: quizHistory = [] } = useQuery({
    queryKey: ["quiz-stats"],
    queryFn: async () => {
      const stats = await getUserStats();
      return stats.quizStats || [];
    },
    enabled: showStats
  });

  if (showStats) {
    return (
      <section className="mb-8 slide-up">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 gradient-text">Quiz Statistics</h2>
            <p className="text-gray-400 font-medium">Your complete quiz history</p>
          </div>
          <Button 
            onClick={() => setShowStats(false)}
            className="glass-button text-white px-4 py-2 font-medium"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-4">
          {quizHistory.length === 0 ? (
            <Card className="glass-card smooth-transition">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 glass-card-subtle rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300 font-medium mb-2">No quiz history available yet.</p>
                <p className="text-gray-500 text-sm">Start practicing to see your stats here!</p>
              </CardContent>
            </Card>
          ) : quizHistory.map((quiz, index) => (
            <Card key={index} className="glass-card hover:bg-white/10 smooth-transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-4 h-4 rounded-full ${
                        quiz.accuracy >= 90 ? 'bg-green-400' : 
                        quiz.accuracy >= 75 ? 'bg-blue-400' : 
                        quiz.accuracy >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                      } shadow-lg`}></div>
                      <span className="text-sm text-gray-400 font-medium">{quiz.date}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">
                      {quiz.chapterTitle} - {quiz.subjectTitle}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {new Date(quiz.date).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-white">
                        Score: {quiz.score}/{quiz.totalQuestions} ({quiz.percentage}%)
                      </span>
                    </div>
                    {quiz.subtopic && (
                      <p className="text-sm text-gray-400 mb-3 font-medium">
                        Subtopic: {quiz.subtopic}
                      </p>
                    )}
                    <div className="flex items-center space-x-6 text-sm">
                      <span className="text-gray-300 font-medium">
                        Score: <span className="font-bold text-white">{quiz.score}/{quiz.totalQuestions}</span>
                      </span>
                      <span className="text-gray-300 font-medium">
                        Accuracy: <span className={`font-bold ${
                          quiz.accuracy >= 90 ? 'text-green-400' : 
                          quiz.accuracy >= 75 ? 'text-blue-400' : 
                          quiz.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{quiz.accuracy}%</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 gradient-text">Dashboard</h2>
          <p className="text-gray-400 font-medium">Track your preparation progress</p>
        </div>
        <Button 
          onClick={() => setShowStats(true)}
          className="ios-button-primary flex items-center space-x-2 px-4 py-2 font-medium"
        >
          <BarChart3 className="w-4 h-4" />
          <span>View Stats</span>
        </Button>
      </div>

      {/* From Uiverse.io by 00Kubi */}
      <div className="container noselect">
        <div className="canvas">
          <div className="tracker tr-1"></div>
          <div className="tracker tr-2"></div>
          <div className="tracker tr-3"></div>
          <div className="tracker tr-4"></div>
          <div className="tracker tr-5"></div>
          <div className="tracker tr-6"></div>
          <div className="tracker tr-7"></div>
          <div className="tracker tr-8"></div>
          <div className="tracker tr-9"></div>
        </div>
        <div id="card">
          <div className="card-content">
            <div className="card-glare"></div>
            <div className="cyber-lines">
              <span></span><span></span><span></span><span></span>
            </div>
            <p id="prompt">HOVER ME</p>
            <div className="title">CYBER<br />CARD</div>
            <div className="glowing-elements">
              <div className="glow-1"></div>
              <div className="glow-2"></div>
              <div className="glow-3"></div>
            </div>
            <div className="subtitle">
              <span>INTERACTIVE</span>
              <span className="highlight">3D EFFECT</span>
            </div>
            <div className="card-particles">
              <span></span><span></span><span></span> <span></span><span></span><span></span>
            </div>
            <div className="corner-elements">
              <span></span><span></span><span></span><span></span>
            </div>
            <div className="scan-line"></div>
          </div>
        </div>
      </div>
    </section>
  );
}