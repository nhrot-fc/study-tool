import { Card, HStack, VStack, Heading, Text, Button, Badge } from "@chakra-ui/react";
import { type QuizResult, type QuizReadDetail } from "../../lib/types";

interface QuizResultCardProps {
  result: QuizResult | null;
  quiz: QuizReadDetail;
  onReturn: () => void;
}

export function QuizResultCard({ result, quiz, onReturn }: QuizResultCardProps) {
  const score = result?.score ?? quiz.score ?? 0;
  const passed = result?.passed ?? score >= 75;
  const color = passed ? "green" : "red";

  return (
    <Card.Root variant="outline" mb={8} colorPalette={color}>
      <Card.Body py={4}>
        <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
          
          {/* Lado Izquierdo: Datos */}
          <HStack gap={4}>
            <Heading size="3xl" color={`${color}.600`}>
              {score.toFixed(0)}%
            </Heading>
            <VStack align="start" gap={0}>
              <Badge variant="surface" colorPalette={color} mb={1}>
                {passed ? "PASSED" : "FAILED"}
              </Badge>
              <Text color="fg.muted" fontSize="sm">
                 {result ? `${result.correct_answers}/${result.total_questions} Correct` : "Completed"}
              </Text>
            </VStack>
          </HStack>

          {/* Lado Derecho: Acción */}
          <Button variant="ghost" onClick={onReturn} size="sm">
            Return to Plan
          </Button>
          
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}