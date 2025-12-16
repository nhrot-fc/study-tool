import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Heading,
  VStack,
  Text,
  Button,
  HStack,
  Spinner,
  Center,
  Box,
  Progress,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import {
  type QuizReadDetail,
  type QuizResult,
  type QuestionUserSelectedOptions,
} from "../lib/types";
import { LuArrowLeft, LuCircleCheck, LuCircleX } from "react-icons/lu";
import { toast } from "sonner";
import { QuestionCard } from "../components/quizzes/QuestionCard";
import { QuizTimer } from "../components/quizzes/QuizTimer";
import { QuizResultCard } from "../components/quizzes/QuizResultCard";

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizReadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  // --- 1. DATA LOADING ---
  const loadQuiz = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiClient.getQuiz(id);
      setQuiz(data);
      if (!data.started_at && !data.completed_at) {
        await apiClient.startQuiz(id);
      }
    } catch (err) {
      console.error("Failed to load quiz", err);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  // --- 2. LOGIC HANDLERS ---
  const handleAnswerChange = (
    questionId: string,
    optionId: string,
    checked: boolean,
    isMultiple: boolean,
  ) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        return checked
          ? { ...prev, [questionId]: [...current, optionId] }
          : { ...prev, [questionId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const handleSubmit = useCallback(
    async (force: boolean | React.MouseEvent = false) => {
      if (!id || !quiz) return;

      const isForce = force === true;
      const submissionAnswers: QuestionUserSelectedOptions[] = [];

      Object.entries(answers).forEach(([questionId, selectedOptionIds]) => {
        selectedOptionIds.forEach((optionId) => {
          submissionAnswers.push({
            question_id: questionId,
            selected_option_id: optionId,
          });
        });
      });

      // Validation
      const answeredCount = Object.keys(answers).length;
      if (!isForce && answeredCount < quiz.questions.length) {
        toast.error(
          `You have ${quiz.questions.length - answeredCount} unanswered questions.`,
        );
        return;
      }

      setSubmitting(true);
      try {
        const resultData = await apiClient.submitQuiz(id, {
          answers: submissionAnswers,
        });
        setResult(resultData);
        toast.success("Quiz completed!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Submit error", err);
        toast.error("Failed to submit quiz");
      } finally {
        setSubmitting(false);
      }
    },
    [id, quiz, answers],
  );

  const handleTimerExpire = useCallback(() => {
    toast.warning("Time's up! Submitting answers...");
    handleSubmit(true);
  }, [handleSubmit]);

  // --- 3. DERIVED STATE ---
  const isReviewMode = !!(result || quiz?.completed_at || quiz?.is_expired);

  // Progress calculation
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions.length || 0;
  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // --- 4. RENDER HELPERS ---
  if (loading) {
    return (
      <Center h="100vh">
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500" animation="pulse">
            Preparing your exam...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!quiz) {
    return (
      <Container py={20} textAlign="center">
        <Heading color="red.500">Quiz not found</Heading>
        <Button mt={4} variant="outline" onClick={() => navigate("/")}>
          Return Home
        </Button>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* --- STICKY HEADER (Active Mode Only) --- */}
      {!isReviewMode && (
        <Box
        >
          <Container maxW="container.md" py={3}>
            <VStack gap={2} align="stretch">
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      navigate(`/plans/${quiz.study_plan_id}/quizzes`)
                    }
                  >
                    <LuArrowLeft /> Exit
                  </Button>
                  <Heading
                    size="sm"
                    truncate
                    maxW="200px"
                    display={{ base: "none", sm: "block" }}
                  >
                    {quiz.title}
                  </Heading>
                </HStack>

                <HStack>
                  <Badge variant="surface" colorPalette="blue">
                    {answeredCount} / {totalQuestions} Answered
                  </Badge>
                  {quiz.started_at && (
                    <QuizTimer
                      startedAt={quiz.started_at}
                      durationMinutes={quiz.duration_minutes}
                      onExpire={handleTimerExpire}
                    />
                  )}
                </HStack>
              </HStack>
              <Progress.Root
                value={progressPercent}
                size="xs"
                colorPalette="blue"
              >
                <Progress.Track>
                  <Progress.Range transition="width 0.3s ease" />
                </Progress.Track>
              </Progress.Root>
            </VStack>
          </Container>
        </Box>
      )}

      {/* --- MAIN CONTENT --- */}
      <Container maxW="container.md" py={8}>
        {/* REVIEW HEADER */}
        {isReviewMode && (
          <VStack gap={6} mb={8} align="stretch">
            <Button
              variant="ghost"
              justifyContent="start"
              w="fit-content"
              onClick={() => navigate(`/plans/${quiz.study_plan_id}`)}
            >
              <LuArrowLeft /> Back to Study Plan
            </Button>

            <QuizResultCard
              result={result}
              quiz={quiz}
              onReturn={() => navigate(`/plans/${quiz.study_plan_id}`)}
            />

            <HStack>
              <Icon as={LuCircleCheck} color="green.500" />
              <Heading size="lg">Detailed Review</Heading>
            </HStack>
          </VStack>
        )}

        {/* ACTIVE HEADER (Simple) */}
        {!isReviewMode && (
          <VStack align="start" gap={2} mb={8} mt={4}>
            <Heading size="2xl">{quiz.title}</Heading>
            <Text color="gray.500" fontSize="lg">
              Read each question carefully. Select the best answer(s).
            </Text>
          </VStack>
        )}

        {/* QUESTIONS LIST */}
        <VStack gap={6} align="stretch">
          {quiz.questions.map((question, index) => {
            // Logic for visual feedback in Review Mode
            let borderColor = "transparent";
            let statusIcon = null;

            if (isReviewMode) {
              // Did user select any correct option? (Simplified check)
              // In a real app, you match exact sets. Here we check overlap.
              const userOptions = result
                ? answers[question.id] || [] // Keep local state if available or map from result
                : quiz.user_answers
                    ?.filter((ua) => ua.question_id === question.id)
                    .map((ua) => ua.selected_option_id) || [];

              // Check if user got it right (Simplified: requires all correct options to be selected)
              // NOTE: A rigorous check would compare sets. Assuming strict equality here for visuals.
              const correctOptions = question.options
                .filter((o) => o.is_correct)
                .map((o) => o.id);
              const isCorrect =
                userOptions.length === correctOptions.length &&
                userOptions.every((opt) => correctOptions.includes(opt));

              borderColor = isCorrect ? "green.300" : "red.300";
              statusIcon = isCorrect ? (
                <HStack color="green.600" mb={2}>
                  <Icon as={LuCircleCheck} />
                  <Text fontWeight="bold">Correct</Text>
                </HStack>
              ) : (
                <HStack color="red.600" mb={2}>
                  <Icon as={LuCircleX} />
                  <Text fontWeight="bold">Incorrect</Text>
                </HStack>
              );
            }

            return (
              <Box
                key={question.id}
                position="relative"
                id={`q-${question.id}`}
              >
                {statusIcon}
                <Box
                  borderWidth={isReviewMode ? "2px" : "0px"}
                  borderColor={borderColor}
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <QuestionCard
                    question={question}
                    index={index}
                    selectedOptions={answers[question.id]}
                    onAnswerChange={
                      !isReviewMode ? handleAnswerChange : undefined
                    }
                    readOnly={isReviewMode}
                    // For styling within the card during review
                    isCorrectOption={(optId) =>
                      question.options.find((o) => o.id === optId)
                        ?.is_correct ?? false
                    }
                    isUserSelected={(optId) => {
                      if (result) return answers[question.id]?.includes(optId);
                      return (
                        quiz.user_answers?.some(
                          (ua) =>
                            ua.question_id === question.id &&
                            ua.selected_option_id === optId,
                        ) ?? false
                      );
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </VStack>

        {/* --- FOOTER ACTIONS --- */}
        {!isReviewMode && (
          <Box pt={6} borderTopWidth="1px" borderColor="border.subtle">
            <HStack justify="space-between">
              <Text color="gray.500" fontSize="sm">
                {totalQuestions - answeredCount} questions remaining
              </Text>
              <Button
                size="xl"
                variant="outline"
                colorPalette="blue"
                onClick={() => handleSubmit()}
                loading={submitting}
                px={8}
              >
                Submit
              </Button>
            </HStack>
          </Box>
        )}
      </Container>
    </Box>
  );
}
