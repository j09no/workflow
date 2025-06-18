import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Trophy,
  Pause,
  Home,
  RotateCcw,
  Play,
  LogOut
} from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { calculateQuizScore, calculateQuestionScore, NEET_SCORING } from "@/lib/quiz-scoring";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { createQuizStat, updateUserStats, getChapters, getQuestionsByChapter, getSubjects } from "@/lib/api-functions";

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty?: string;
  chapterId: number;
  subtopicId?: number;
  createdAt: Date;
}

export default function Quiz() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timerPaused, setTimerPaused] = useState(false);
  const [quizType, setQuizType] = useState<'chapter' | 'subtopic' | 'wrongOnly'>('chapter');
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [subtopicInfo, setSubtopicInfo] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const { timeRemaining: timeLeft, start: startTimer, pause: pauseTimer, reset: resetTimer, isRunning } = useTimer({
    initialTime: 30 * 60, // 30 minutes
    onTimeUp: () => handleQuizComplete(),
    autoStart: false
  });

  const handleQuizComplete = async () => {
    setShowResults(true);
    pauseTimer();

    // Save quiz result to localStorage
    try {
      const results = calculateResults();
      await saveQuizResult(results);
    } catch (error) {
      console.error('Failed to save quiz result:', error);
    }
  };

  const saveQuizResult = async (results: any) => {
    try {
      const currentChapter = chapters?.find(c => c.id === selectedChapter);

      await createQuizStat({
        date: new Date(),
        chapterTitle: currentChapter?.title || 'Unknown Chapter',
        subtopicTitle: subtopicInfo?.subtopicTitle || undefined,
        subjectTitle: currentChapter?.subject || 'Unknown Subject',
        score: results.correct,
        totalQuestions: questions.length,
        percentage: Math.round((results.correct / questions.length) * 100)
      });
    } catch (error) {
      console.error('Failed to save quiz result:', error);
    }
  };

  // Load chapters on component mount
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const data = await getChapters();
        setChapters(data);
      } catch (error) {
        console.error('Error loading chapters:', error);
      }
    };

    loadChapters();
  }, []);

  // Load questions when chapter is selected
  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedChapter || quizType !== 'chapter') return;

      setQuestionsLoading(true);
      try {
        const chapterQuestions = await getQuestionsByChapter(selectedChapter);
        // Filter to only include questions that belong directly to the chapter (not subtopics)
        const chapterOnlyQuestions = chapterQuestions.filter(q => !q.subtopicId);
        setQuestions(chapterOnlyQuestions);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);

        if (chapterOnlyQuestions.length === 0) {
          toast({
            title: "No Chapter Questions Available",
            description: "This chapter doesn't have any direct questions. Add questions to the chapter (not subtopics) first.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: "Error Loading Questions",
          description: "Failed to load questions for this chapter.",
          variant: "destructive",
        });
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, [selectedChapter, quizType, toast]);



  // Check for subtopic quiz data
  useEffect(() => {
    const subtopicQuizData = localStorage.getItem('currentSubtopicQuiz');
    if (subtopicQuizData) {
      const { subtopicId, subtopicTitle, chapterId, questions: subtopicQuestions } = JSON.parse(subtopicQuizData);
      setSelectedChapter(chapterId);
      setSubtopicInfo({ subtopicId, subtopicTitle });
      setQuizType('subtopic');
      // Filter questions that belong to this specific subtopic
      const filteredQuestions = subtopicQuestions.filter(q => q.subtopicId === subtopicId);
      setQuestions(filteredQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      // Clear the data after using it
      localStorage.removeItem('currentSubtopicQuiz');
    }
  }, []);

  // Show chapter selection if no chapter is selected
  if (!selectedChapter || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white slide-up">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-3 gradient-text">Select Chapter</h1>
            <p className="text-gray-400 text-sm font-medium">Choose a chapter to start practicing</p>
          </div>

          <div className="space-y-4">
            {chapters?.map((chapter) => (
              <Card 
                key={chapter.id} 
                className="glass-card smooth-transition hover:scale-[1.02] hover:bg-white/10 cursor-pointer group"
                onClick={() => {
                  setSelectedChapter(chapter.id);
                  setQuizType('chapter');
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{chapter.title}</h3>
                      <p className="text-gray-400 text-sm font-medium leading-relaxed">{chapter.description}</p>
                    </div>
                    <div className="w-12 h-12 glass-card-subtle rounded-2xl flex items-center justify-center ml-4">
                      <Play className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-blue-400 font-medium bg-blue-400/10 px-3 py-1 rounded-full">
                        {chapter.totalQuestions} Questions
                      </span>
                      <Badge variant="secondary" className="text-xs bg-gray-800/50 text-gray-300">
                        {chapter.completedQuestions || 0} completed
                      </Badge>
                    </div>
                    <Button 
                      className="ios-button-primary text-sm h-9 px-4 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChapter(chapter.id);
                        setQuizType('chapter');
                      }}
                    >
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {questionsLoading && selectedChapter && (
            <div className="text-center mt-8">
              <div className="w-8 h-8 mx-auto mb-4 glass-card-subtle rounded-xl flex items-center justify-center">
                <div className="ios-spinner"></div>
              </div>
              <p className="text-gray-400 text-sm font-medium">Loading questions...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Show loading if currentQuestion is not available
  if (!currentQuestion && quizStarted && !showResults) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading question...</p>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (answer: string, optionLetter: string) => {
    const newSelectedAnswers = {
      ...selectedAnswers,
      [currentQuestionIndex]: optionLetter, // Store the letter (A, B, C, D) instead of full text
    };
    setSelectedAnswers(newSelectedAnswers);

    // Auto move to next question
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // Quiz completed
        handleQuizComplete();
      }
    }, 500);
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    startTimer();
  };

  const handlePauseTimer = () => {
    if (isRunning) {
      pauseTimer();
      setTimerPaused(true);
    } else {
      startTimer();
      setTimerPaused(false);
    }
  };

  const handleExitQuiz = () => {
    setShowResults(true);
    pauseTimer();
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizStarted(false);
    setTimerPaused(false);
    resetTimer();
  };

  const handleWrongTry = () => {
    const wrongQuestions = questions.filter((question, index) => 
      selectedAnswers[index] && selectedAnswers[index].trim().toUpperCase() !== question.correctAnswer.trim().toUpperCase()
    );

    if (wrongQuestions.length === 0) {
      toast({
        title: "Perfect Score!",
        description: "You got all questions right. No wrong answers to practice!",
      });
      return;
    }

    setQuestions(wrongQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizStarted(false);
    setTimerPaused(false);
    setQuizType('wrongOnly');
    resetTimer();
  };

  const handleGoHome = () => {
    setLocation("/dashboard");
  };

  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      if (!userAnswer) {
        unanswered++;
      } else if (userAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase()) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const score = (correct * NEET_SCORING.CORRECT) + (incorrect * NEET_SCORING.INCORRECT);
    return { correct, incorrect, unanswered, score };
  };

  const { correct, incorrect, unanswered, score } = calculateResults();

  // Pre-quiz state
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Ready to Start?</h1>
          <p className="text-gray-400 mb-3">
            {quizType === 'subtopic' ? subtopicInfo?.subtopicTitle : chapters?.find(c => c.id === selectedChapter)?.title}
          </p>
          <p className="text-sm text-gray-300 mb-6">
            {totalQuestions} Questions • 30 Minutes
          </p>
          <Button 
            onClick={handleStartQuiz}
            className="bg-green-600 hover:bg-green-500 px-8 py-2"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Results page
  if (showResults) {
    return (
      <div className="min-h-screen bg-black text-white p-3">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h1 className="text-lg font-bold mb-2">Quiz Complete!</h1>
            <div className="text-lg font-bold mb-3">Score: {score}</div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-center">
              <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-base font-bold text-green-400">{correct}</div>
              <div className="text-gray-300 text-xs">Correct</div>
            </div>
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center">
              <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <div className="text-base font-bold text-red-400">{incorrect}</div>
              <div className="text-gray-300 text-xs">Incorrect</div>
            </div>
            <div className="bg-gray-900/30 border border-gray-500/30 rounded-lg p-3 text-center">
              <div className="w-5 h-5 bg-gray-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <div className="text-base font-bold text-gray-400">{unanswered}</div>
              <div className="text-gray-300 text-xs">Skipped</div>
            </div>
          </div>

          {/* Show correct answers */}
          <div className="mb-4">
            <h2 className="text-base font-bold mb-3">Review Answers</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer && userAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();

                return (
                  <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-2">
                    <div className="flex items-start space-x-2">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                        !userAnswer ? "bg-gray-500" : isCorrect ? "bg-green-500" : "bg-red-500"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-300 text-xs mb-1">{question.question}</p>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-green-400 text-xs font-bold">Correct:</span>
                            <span className="text-white text-xs">{question.correctAnswer}</span>
                          </div>
                          {userAnswer && userAnswer.trim().toUpperCase() !== question.correctAnswer.trim().toUpperCase() && (
                            <div className="flex items-center space-x-1">
                              <span className="text-red-400 text-xs font-bold">Your answer:</span>
                              <span className="text-white text-xs">{userAnswer}</span>
                            </div>
                          )}
                          {!userAnswer && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400 text-xs font-bold">Not answered</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-2">
            <Button 
              onClick={handlePlayAgain}
              className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1 h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Play Again
            </Button>
            {incorrect > 0 && (
              <Button 
                onClick={handleWrongTry}
                className="bg-orange-600 hover:bg-orange-500 text-xs px-3 py-1 h-8"
              >
                Wrong Try
              </Button>
            )}
            <Button 
              onClick={handleGoHome}
              className="bg-gray-600 hover:bg-gray-500 text-xs px-3 py-1 h-8"
            >
              <Home className="w-3 h-3 mr-1" />
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <div className="bg-gray-900 border-b border-gray-700 p-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            onClick={handlePauseTimer}
            variant="ghost"
            className="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1 h-7"
          >
            <Pause className="w-3 h-3 mr-1" />
            {timerPaused ? 'Resume' : 'Pause'}
          </Button>

          <div className="text-center">
            <div className="text-base font-bold">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <Button
            onClick={handleExitQuiz}
            variant="ghost"
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 h-7"
          >
            <LogOut className="w-3 h-3 mr-1" />
            Exit
          </Button>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-3">
        <div className="max-w-2xl mx-auto">
          <div className="mb-3 text-center">
            <div className="text-xs font-medium text-gray-400 mb-2">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <h2 className="text-sm font-medium mb-4 leading-relaxed">
                {currentQuestion.question}
              </h2>

              <div className="space-y-2">
                {[
                  { key: 'A', value: currentQuestion.optionA },
                  { key: 'B', value: currentQuestion.optionB },
                  { key: 'C', value: currentQuestion.optionC },
                  { key: 'D', value: currentQuestion.optionD }
                ].map((option) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === option.key;

                  return (
                    <button
                      key={`question-${currentQuestionIndex}-option-${option.key}`}
                      onClick={() => handleAnswerSelect(option.value, option.key)}
                      className={cn(
                        "w-full p-3 text-left rounded-lg border-2 transition-all duration-200",
                        "hover:border-blue-500 hover:bg-blue-500/10",
                        isSelected ? "border-blue-500 bg-blue-500/20" : "border-gray-600 bg-gray-800/50"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                          isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-500 text-gray-300"
                        )}>
                          {option.key}
                        </span>
                        <span className="flex-1 text-xs">
                          {option.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}