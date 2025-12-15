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
  Icon,
  Badge,
  Box,
  Separator,
} from "@chakra-ui/react";
import { LuArrowLeft, LuClock, LuTrophy, LuBrainCircuit } from "react-icons/lu";
import { apiClient } from "../lib/api";
import { type QuizRead } from "../lib/types";
import { useStudyPlan } from "../hooks/use-study-plan";
import { QuizGeneratePopover } from "../components/quizzes/QuizGeneratePopover";

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
        <Spinner color="blue.500" size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.md">
      {/* Header Minimalista */}
      <VStack align="start" gap={6} mb={10}>
        <Button
          variant="plain"
          px={0}
          color="fg.muted"
          _hover={{ color: "fg.subtle" }}
          onClick={() => navigate(`/plans/${id}`)}
        >
          <LuArrowLeft /> Back to Plan
        </Button>

        <HStack justify="space-between" width="full" wrap="wrap" gap={4}>
          <Heading size="3xl" fontWeight="tight" letterSpacing="tight">
            Quizzes
          </Heading>
          {id && plan && (
            <QuizGeneratePopover
              planId={id}
              studyPlan={plan}
              trigger={
                <Button size="sm" variant="outline" colorPalette="blue">
                  New Quiz
                </Button>
              }
            />
          )}
        </HStack>
      </VStack>

      {/* Lista de Quizzes */}
      {quizzes.length === 0 ? (
        <EmptyState id={id} plan={plan} />
      ) : (
        <VStack align="stretch" gap={3}>
          {quizzes.map((quiz) => (
            <QuizCardItem key={quiz.id} quiz={quiz} onNavigate={navigate} />
          ))}
        </VStack>
      )}
    </Container>
  );
}

// Sub-componente para limpiar el render principal
function QuizCardItem({
  quiz,
  onNavigate,
}: {
  quiz: QuizRead;
  onNavigate: any;
}) {
  const isCompleted = !!quiz.completed_at;
  const isExpired = !!quiz.is_expired;
  const isInProgress = !!quiz.started_at && !isCompleted && !isExpired;

  // Color semántico basado en estado
  const statusColor = isCompleted
    ? (quiz.score ?? 0) >= 75
      ? "green"
      : (quiz.score ?? 0) >= 50
        ? "orange"
        : "red"
    : isExpired
      ? "red"
      : isInProgress
        ? "blue"
        : "gray";

  return (
    <Card.Root
      variant="outline"
      size="sm"
      transition="all 0.2s"
      _hover={{ borderColor: "border.emphasized", shadow: "xs" }}
    >
      <Card.Body py={4}>
        <HStack justify="space-between" gap={4} wrap="wrap">
          {/* Info Principal */}
          <VStack align="start" gap={2} flex={1}>
            <HStack>
              <Heading size="md" fontWeight="semibold">
                {quiz.title}
              </Heading>
              {isInProgress && (
                <Badge size="sm" colorPalette="blue" variant="surface">
                  In Progress
                </Badge>
              )}
              {isExpired && !isCompleted && (
                <Badge size="sm" colorPalette="red" variant="surface">
                  Expired
                </Badge>
              )}
            </HStack>

            {/* Metadatos Limpios: Icono + Texto gris */}
            <HStack fontSize="xs" color="fg.muted" gap={4}>
              <HStack gap={1}>
                <Icon as={LuClock} />
                <Text>{quiz.duration_minutes} min</Text>
              </HStack>
              <Separator orientation="vertical" height="12px" />
              <HStack gap={1}>
                <Icon as={LuBrainCircuit} />
                <Text>Difficulty {quiz.difficulty}</Text>
              </HStack>
            </HStack>
          </VStack>

          {/* Acción / Resultado */}
          <HStack gap={4}>
            {isCompleted && quiz.score !== undefined ? (
              <HStack
                gap={1}
                color={statusColor + ".500"}
                pr={2}
              >
                <LuTrophy />
                <Text fontWeight="bold" fontSize="lg">
                  {Math.round(quiz.score ?? 0)}%
                </Text>
              </HStack>
            ) : null}

            <Button
              size="sm"
              variant="outline"
              colorPalette={statusColor}
              onClick={() => onNavigate(`/quizzes/${quiz.id}`)}
            >
              {isCompleted
                ? "Review"
                : isExpired
                  ? "Expired"
                  : isInProgress
                    ? "Continue"
                    : "Start Quiz"}
            </Button>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

// Componente de estado vacío
function EmptyState({ id, plan }: { id?: string; plan?: any }) {
  return (
    <Card.Root variant="outline" borderStyle="dashed" py={10}>
      <Center flexDirection="column" gap={4}>
        <Box p={4} bg="gray.50" borderRadius="full" color="gray.400">
          <LuBrainCircuit size={32} />
        </Box>
        <VStack gap={1}>
          <Text fontWeight="medium">No quizzes yet</Text>
          <Text color="fg.muted" fontSize="sm">
            Create a quiz to test your knowledge.
          </Text>
        </VStack>
        {id && plan && (
          <QuizGeneratePopover
            planId={id}
            studyPlan={plan}
            trigger={
              <Button variant="surface" mt={2}>
                Generate First Quiz
              </Button>
            }
          />
        )}
      </Center>
    </Card.Root>
  );
}
