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
  Badge,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import { type QuizRead } from "../lib/types";
import { useStudyPlan } from "../hooks/use-study-plan";
import { LuArrowLeft, LuPlay, LuCircleCheck } from "react-icons/lu";
import { QuizGenerateModal } from "../components/quizzes/QuizGenerateModal";

export default function PlanQuizzes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plan } = useStudyPlan(id || "");
  const [quizzes, setQuizzes] = useState<QuizRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient
      .getPlanQuizzes(id)
      .then(setQuizzes)
      .catch((err) => console.error("Failed to load quizzes", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Button variant="ghost" mb={6} onClick={() => navigate(`/plans/${id}`)}>
        <HStack gap={2}>
          <LuArrowLeft />
          <Text>Back to Plan</Text>
        </HStack>
      </Button>

      <HStack justify="space-between" mb={8}>
        <Heading size="xl">Quizzes</Heading>
        {id && plan && <QuizGenerateModal planId={id} studyPlan={plan} />}
      </HStack>

      {quizzes.length === 0 ? (
        <Center py={12} flexDirection="column" gap={4}>
          <Text color="gray.500" fontSize="lg">
            No quizzes generated yet.
          </Text>
          {id && plan && (
            <QuizGenerateModal
              planId={id}
              studyPlan={plan}
              trigger={
                <Button colorPalette="blue">Generate your first quiz</Button>
              }
            />
          )}
        </Center>
      ) : (
        <VStack align="stretch" gap={4}>
          {quizzes.map((quiz) => (
            <Card.Root key={quiz.id} variant="subtle">
              <Card.Body>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Heading size="md">{quiz.title}</Heading>
                    <HStack gap={2}>
                      <Badge colorPalette="purple">
                        Difficulty: {quiz.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {quiz.duration_minutes} min
                      </Badge>
                      {quiz.completed_at ? (
                        <Badge colorPalette="green">Score: {quiz.score}%</Badge>
                      ) : quiz.started_at ? (
                        <Badge colorPalette="blue">In Progress</Badge>
                      ) : (
                        <Badge colorPalette="gray">Not Started</Badge>
                      )}
                    </HStack>
                  </VStack>
                  <Button
                    variant={quiz.completed_at ? "outline" : "solid"}
                    colorPalette={quiz.completed_at ? "gray" : "blue"}
                    onClick={() => navigate(`/quizzes/${quiz.id}`)}
                  >
                    {quiz.completed_at ? (
                      <>
                        <LuCircleCheck /> Review
                      </>
                    ) : quiz.started_at ? (
                      <>
                        <LuPlay /> Continue
                      </>
                    ) : (
                      <>
                        <LuPlay /> Start
                      </>
                    )}
                  </Button>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      )}
    </Container>
  );
}
