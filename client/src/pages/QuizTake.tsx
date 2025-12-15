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
  Separator,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import {
  type QuizReadDetail,
  type QuizResult,
  type QuestionUserSelectedOptions,
} from "../lib/types";
import { LuArrowLeft } from "react-icons/lu";
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

  useEffect(() => {
    if (!id) return;
    const loadQuiz = async () => {
      try {
        const data = await apiClient.getQuiz(id);
        setQuiz(data);
        if (!data.started_at) {
          await apiClient.startQuiz(id);
        }
      } catch (err) {
        console.error("Failed to load quiz", err);
        toast.error("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [id]);

  const handleAnswerChange = (
    questionId: string,
    optionId: string,
    checked: boolean,
    isMultiple: boolean,
  ) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        if (checked) {
          return { ...prev, [questionId]: [...current, optionId] };
        } else {
          return {
            ...prev,
            [questionId]: current.filter((id) => id !== optionId),
          };
        }
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
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

      const answeredQuestionsCount = Object.values(answers).filter(
        (options) => options && options.length > 0,
      ).length;

      if (!isForce && answeredQuestionsCount < quiz.questions.length) {
        toast.error("Please answer all questions before submitting");
        return;
      }

      setSubmitting(true);
      try {
        const resultData = await apiClient.submitQuiz(id, {
          answers: submissionAnswers,
        });
        setResult(resultData);
        toast.success("Quiz submitted!");
        window.scrollTo(0, 0);
      } catch (err) {
        console.error("Failed to submit quiz", err);
        toast.error("Failed to submit quiz");
      } finally {
        setSubmitting(false);
      }
    },
    [id, quiz, answers],
  );

  const handleTimerExpire = useCallback(() => {
    toast.error("Time expired! Submitting quiz...");
    handleSubmit(true);
  }, [handleSubmit]);

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!quiz) {
    return (
      <Container py={12} textAlign="center">
        <Text color="red.500">Quiz not found</Text>
        <Button mt={4} onClick={() => navigate("/")}>
          Go Home
        </Button>
      </Container>
    );
  }

  if (result || quiz.completed_at) {
    const isSelected = (questionId: string, optionId: string) => {
      if (result) {
        return answers[questionId]?.includes(optionId);
      }
      return quiz.user_answers?.some(
        (ua) =>
          ua.question_id === questionId && ua.selected_option_id === optionId,
      );
    };

    return (
      <Container maxW="container.md">
        <Button
          variant="ghost"
          mb={6}
          onClick={() => navigate(`/plans/${quiz.study_plan_id}/quizzes`)}
        >
          <HStack gap={2}>
            <LuArrowLeft />
            <Text>Back to Quizzes</Text>
          </HStack>
        </Button>

        <QuizResultCard
          result={result}
          quiz={quiz}
          onReturn={() => navigate(`/plans/${quiz.study_plan_id}`)}
        />

        <VStack gap={6} align="stretch">
          <Heading size="lg">Review</Heading>
          {quiz.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              readOnly
              isCorrectOption={(optId) =>
                question.options.find((o) => o.id === optId)?.is_correct ??
                false
              }
              isUserSelected={(optId) =>
                isSelected(question.id, optId) ?? false
              }
            />
          ))}
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Button
        variant="ghost"
        mb={6}
        onClick={() => navigate(`/plans/${quiz.study_plan_id}/quizzes`)}
      >
        <HStack gap={2}>
          <LuArrowLeft />
          <Text>Back to Quizzes</Text>
        </HStack>
      </Button>

      <VStack gap={8} align="stretch">
        <HStack justify="space-between" align="start">
          <Box>
            <Heading size="xl" mb={2}>
              {quiz.title}
            </Heading>
            <Text color="gray.600">Answer all questions below. Good luck!</Text>
          </Box>
          {quiz.started_at && (
            <QuizTimer
              startedAt={quiz.started_at}
              durationMinutes={quiz.duration_minutes}
              onExpire={handleTimerExpire}
            />
          )}
        </HStack>

        <VStack gap={6} align="stretch">
          {quiz.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              selectedOptions={answers[question.id]}
              onAnswerChange={handleAnswerChange}
            />
          ))}
        </VStack>

        <Separator />

        <HStack justify="flex-end">
          <Button
            size="lg"
            colorPalette="blue"
            onClick={handleSubmit}
            loading={submitting}
          >
            Submit Quiz
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
