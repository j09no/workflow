import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ArrowLeft, Play, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVUploadModal } from "@/components/csv-upload-modal";
import { getChapters, getQuestionsByChapter, deleteChapter } from "@/lib/api-functions";

interface ChapterDetailsProps {
  chapterId: string;
}

export default function ChapterDetails({ chapterId }: ChapterDetailsProps) {
  const [, setLocation] = useLocation();
  const [csvUploadModal, setCsvUploadModal] = useState<{ 
    isOpen: boolean; 
    chapterId: number; 
    chapterTitle: string;
  }>({
    isOpen: false,
    chapterId: 0,
    chapterTitle: "",
  });
  const { toast } = useToast();

  // Get chapter data
  const { data: chapters } = useQuery({
    queryKey: ["chapters"],
    queryFn: async () => {
      return await getChapters();
    },
  });

  // Get questions for this chapter
  const { data: questions, refetch: refetchQuestions } = useQuery({
    queryKey: [`questions-chapter-${chapterId}`],
    queryFn: async () => {
      return await getQuestionsByChapter(parseInt(chapterId));
    },
    enabled: !!chapterId,
  });

  const chapter = chapters?.find(c => c.id === parseInt(chapterId));

  const handleDeleteChapter = async () => {
    if (confirm("Are you sure you want to delete this chapter? This will delete all questions in this chapter. This action cannot be undone.")) {
      try {
        await deleteChapter(parseInt(chapterId));
        toast({
          title: "Success",
          description: "Chapter deleted successfully",
        });
        setLocation("/chapters");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete chapter",
          variant: "destructive",
        });
      }
    }
  };

  const handlePlayChapter = async () => {
    try {
      console.log('Playing chapter:', chapterId, chapter?.title);
      const chapterQuestions = await getQuestionsByChapter(parseInt(chapterId));
      
      console.log('Received questions for chapter:', chapterQuestions);
      console.log('Questions count:', chapterQuestions.length);

      if (chapterQuestions && chapterQuestions.length > 0) {
        // Store current chapter for quiz
        localStorage.setItem('currentChapterQuiz', JSON.stringify({
          chapterId: parseInt(chapterId),
          chapterTitle: chapter?.title,
          questions: chapterQuestions
        }));
        setLocation("/quiz");
      } else {
        console.log('No questions found for chapterId:', chapterId);
        toast({
          title: "No Questions Available",
          description: `Please add questions to ${chapter?.title} first using the CSV upload.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading chapter questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions for this chapter",
        variant: "destructive",
      });
    }
  };

  const questionsCount = questions?.length || 0;

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 text-white">
            <p>Chapter not found</p>
            <Button 
              onClick={() => setLocation("/chapters")}
              className="mt-4"
            >
              Back to Chapters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/chapters")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chapters
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{chapter.title}</h1>
              <p className="text-gray-300 mt-1">{chapter.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span>Difficulty: {chapter.difficulty}</span>
                <span>Questions: {questionsCount}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handlePlayChapter}
              className="bg-blue-600 hover:bg-blue-500 text-white"
              disabled={questionsCount === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
            <Button
              onClick={() => setCsvUploadModal({
                isOpen: true,
                chapterId: parseInt(chapterId),
                chapterTitle: chapter.title
              })}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Questions
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChapter}
              className="bg-red-600 hover:bg-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Chapter
            </Button>
          </div>
        </div>

        {/* Chapter Questions Overview */}
        <div className="grid gap-6">
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Book className="w-5 h-5 mr-2 text-blue-400" />
                  Questions Overview
                </h3>
              </div>
              
              {questionsCount === 0 ? (
                <div className="text-center py-8">
                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No questions found</p>
                  <p className="text-sm text-gray-500 mt-1">Upload questions using CSV to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-600/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">{questionsCount}</div>
                      <div className="text-sm text-gray-300">Total Questions</div>
                    </div>
                    <div className="bg-green-600/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-400">{chapter.progress}%</div>
                      <div className="text-sm text-gray-300">Progress</div>
                    </div>
                    <div className="bg-purple-600/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400 capitalize">{chapter.difficulty}</div>
                      <div className="text-sm text-gray-300">Difficulty</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 pt-4">
                    <Button
                      onClick={handlePlayChapter}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Practice Quiz
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <CSVUploadModal
          isOpen={csvUploadModal.isOpen}
          onClose={() => setCsvUploadModal({ isOpen: false, chapterId: 0, chapterTitle: "" })}
          chapterId={csvUploadModal.chapterId}
          chapterTitle={csvUploadModal.chapterTitle}
        />
      </div>
    </div>
  );
}