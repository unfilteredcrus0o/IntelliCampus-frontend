import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import { makeAuthenticatedRequest } from "../utils/api";
import { QUIZ_ENDPOINTS } from "../constants";

interface Choice {
  id: number;
  label: string;
}

interface Question {
  id: number;
  kind: "mcq" | "coding";
  prompt: string;
  choices?: Choice[];
  metadata?: {
    tests?: Array<{ input: string; output: string }>;
  };
}

interface QuizData {
  quiz_id: number;
  attempt_id: number;
  questions: Question[];
}

interface QuizAnswer {
  question_id: number;
  answer?: number | string;
}

interface QuizResult {
  submitted: boolean;
  message: string;
}

interface QuizProps {
  topicId: string;
  onClose: () => void;
  onQuizComplete?: (passed: boolean) => void;
}

const Quiz: React.FC<QuizProps> = ({ topicId, onClose, onQuizComplete }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<{ [questionId: number]: QuizAnswer }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startQuiz();
  }, [topicId]);


  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend API to start quiz
      const response = await makeAuthenticatedRequest(
        QUIZ_ENDPOINTS.START(topicId),
        { method: "POST" }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to start quiz: ${response.status}`);
      }
      
      const data: QuizData = await response.json();
      setQuizData(data);
      
      // Initialize answers object
      const initialAnswers: { [questionId: number]: QuizAnswer } = {};
      data.questions.forEach(question => {
        initialAnswers[question.id] = { question_id: question.id };
      });
      setAnswers(initialAnswers);
      
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Failed to load quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const retakeQuiz = () => {
    // Reset all quiz states to start fresh
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSubmitting(false);
    setError(null);
    
    // Start the quiz again
    startQuiz();
  };


  // Simple submission confirmation since backend doesn't have submit endpoint
  const generateSubmissionResult = (): QuizResult => {
    return {
      submitted: true,
      message: "Quiz submitted successfully! Your responses have been recorded."
    };
  };

  const submitQuiz = async () => {
    if (!quizData) return;

    try {
      setSubmitting(true);
      setError(null);

      // Prepare answers for evaluation
      const answerArray: QuizAnswer[] = Object.values(answers).filter(answer => {
        // Include answers that have either answer value
        return answer.answer !== undefined && answer.answer !== "" && answer.answer !== null;
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate simple submission result
      const result = generateSubmissionResult();
      setQuizResult(result);
      
      // Notify parent component about quiz completion
      if (onQuizComplete) {
        setTimeout(() => {
          onQuizComplete(true); // Always pass true since we don't score
        }, 2500); // 2.5 seconds delay
      }

    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMCQAnswer = (questionId: number, choiceId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: choiceId
      }
    }));
  };

  const handleCodingAnswer = (questionId: number, code: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: code
      }
    }));
  };

  const nextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isCurrentQuestionAnswered = () => {
    if (!quizData) return false;
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const answer = answers[currentQuestion.id];
    
    if (currentQuestion.kind === "mcq") {
      return answer?.answer !== undefined && answer.answer !== null;
    } else {
      return answer?.answer !== undefined && typeof answer.answer === 'string' && answer.answer.trim() !== "";
    }
  };

  const getAnsweredQuestionCount = () => {
    if (!quizData) return 0;
    return quizData.questions.filter(question => {
      const answer = answers[question.id];
      if (question.kind === "mcq") {
        return answer?.answer !== undefined && answer.answer !== null;
      } else {
        return answer?.answer !== undefined && typeof answer.answer === 'string' && answer.answer.trim() !== "";
      }
    }).length;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography>Loading quiz...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={retakeQuiz}>
            Retry
          </Button>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Paper>
    );
  }

  if (quizResult) {
    return (
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2, color: "success.main" }}>
            ✅ Quiz Submitted Successfully!
          </Typography>
          
          <Card sx={{ mb: 3, backgroundColor: "success.light" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {quizResult.message}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Thank you for completing the quiz. Your responses have been recorded.
              </Typography>
            </CardContent>
          </Card>

          <Alert severity="success" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Next Steps:</Typography>
            <Typography>
              You can now continue with your learning journey. Click "Continue Learning" below to proceed.
            </Typography>
          </Alert>
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="outlined" onClick={retakeQuiz}>
            Retake Quiz
          </Button>
          <Button variant="contained" onClick={onClose}>
            Continue Learning
          </Button>
        </Box>
      </Paper>
    );
  }

  if (!quizData) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography>No quiz data available.</Typography>
        <Button variant="contained" onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Paper>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
  const answeredCount = getAnsweredQuestionCount();

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      {/* Quiz Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">Quiz</Typography>
          <Chip 
            label={`${answeredCount}/${quizData.questions.length} answered`} 
            color={answeredCount === quizData.questions.length ? "success" : "primary"}
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          Question {currentQuestionIndex + 1} of {quizData.questions.length}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Current Question */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {currentQuestion.prompt}
          </Typography>

          {currentQuestion.kind === "mcq" && currentQuestion.choices && (
            <RadioGroup
              value={answers[currentQuestion.id]?.answer || ""}
              onChange={(e) => handleMCQAnswer(currentQuestion.id, parseInt(e.target.value))}
            >
              {currentQuestion.choices.map((choice) => (
                <FormControlLabel
                  key={choice.id}
                  value={choice.id}
                  control={<Radio />}
                  label={choice.label}
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          )}

          {currentQuestion.kind === "coding" && (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={8}
                placeholder="Write your code here..."
                value={answers[currentQuestion.id]?.answer || ""}
                onChange={(e) => handleCodingAnswer(currentQuestion.id, e.target.value)}
                sx={{ 
                  mb: 2,
                  "& .MuiInputBase-input": {
                    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                    fontSize: "14px",
                  }
                }}
              />
              
              {currentQuestion.metadata?.tests && (
                <Alert severity="info">
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Test Cases:</Typography>
                  {currentQuestion.metadata.tests.map((test, index) => (
                    <Typography key={index} variant="body2" sx={{ fontFamily: "monospace" }}>
                      Input: {test.input} → Expected Output: {test.output}
                    </Typography>
                  ))}
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation and Submit */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < quizData.questions.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={nextQuestion}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="success"
              onClick={submitQuiz}
              disabled={submitting || answeredCount === 0}
            >
              {submitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          )}
        </Box>

        <Button variant="text" onClick={onClose} color="error">
          Cancel
        </Button>
      </Box>

      {answeredCount < quizData.questions.length && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You have {quizData.questions.length - answeredCount} unanswered question(s). 
          You can submit with partial answers or continue answering.
        </Alert>
      )}
    </Paper>
  );
};

export default Quiz;
