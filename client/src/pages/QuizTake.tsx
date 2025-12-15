import { useEffect, useState } from "react";
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
  Card,
  RadioGroup,
  Box,
  Separator,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import {
  type QuizReadDetail,
  type QuizResult,
  type QuestionUserSelectedOptions,
} from "../lib/types";
import { LuArrowLeft, LuCircleCheck, LuCircleX } from "react-icons/lu";
import { toast } from "sonner";

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizReadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadQuiz = async () => {
      try {
        const data = await apiClient.getQuiz(id);
        setQuiz(data);
        if (data.completed_at) {
          // If already completed, we might want to show results directly
          // But the API for getQuiz returns QuizReadDetail which doesn't have result details like correct answers
          // We might need to fetch result separately or just show score
          // For now, let's just show the score from the quiz details
        } else if (!data.started_at) {
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

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!id || !quiz) return;

    const submissionAnswers: QuestionUserSelectedOptions[] = Object.entries(
      answers,
    ).map(([questionId, selectedOptionId]) => ({
      question_id: questionId,
      selected_option_id: selectedOptionId,
    }));

    if (submissionAnswers.length < quiz.questions.length) {
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
  };

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
    const score = result?.score ?? quiz.score ?? 0;
    const passed = result?.passed ?? score >= 70; // Assuming 70 is pass

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

        <Card.Root variant="elevated" mb={8}>
          <Card.Body textAlign="center" py={10}>
            <VStack gap={4}>
              {passed ? (
                <LuCircleCheck size={64} color="green" />
              ) : (
                <LuCircleX size={64} color="red" />
              )}
              <Heading size="2xl">{score}%</Heading>
              <Text fontSize="xl" fontWeight="medium">
                {passed ? "Quiz Passed!" : "Quiz Failed"}
              </Text>
              <Text color="gray.500">
                {result
                  ? `You got ${result.correct_answers} out of ${result.total_questions} correct.`
                  : "Quiz completed."}
              </Text>
              <Button
                colorPalette="blue"
                onClick={() => navigate(`/plans/${quiz.study_plan_id}`)}
              >
                Return to Study Plan
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
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
        <Box>
          <Heading size="xl" mb={2}>
            {quiz.title}
          </Heading>
          <Text color="gray.600">Answer all questions below. Good luck!</Text>
        </Box>

        <VStack gap={6} align="stretch">
          {quiz.questions.map((question, index) => (
            <Card.Root key={question.id}>
              <Card.Body>
                <VStack align="start" gap={4}>
                  <Text fontWeight="bold" fontSize="lg" color="gray.400">
                    {index + 1}. {question.title}
                  </Text>
                  <Text>{question.description}</Text>
                  <RadioGroup.Root
                    value={answers[question.id] || ""}
                    onValueChange={(e) =>
                      handleAnswerChange(question.id, e.value as string)
                    }
                  >
                    <VStack align="start" gap={3}>
                      {question.options.map((option) => (
                        <RadioGroup.Item
                          key={option.id}
                          value={option.id}
                          width="full"
                          p={2}
                          borderWidth="1px"
                          borderRadius="md"
                          _checked={{
                            borderColor: "blue.500",
                            bg: "blue.50",
                            _dark: { bg: "blue.900/20" },
                          }}
                        >
                          <RadioGroup.ItemText flex="1">
                            {option.text}
                          </RadioGroup.ItemText>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemControl />
                        </RadioGroup.Item>
                      ))}
                    </VStack>
                  </RadioGroup.Root>
                </VStack>
              </Card.Body>
            </Card.Root>
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
