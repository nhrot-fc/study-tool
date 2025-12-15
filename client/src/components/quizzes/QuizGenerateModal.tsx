import { useState } from "react";
import {
  Button,
  VStack,
  Input,
  Textarea,
  Text,
  Box,
} from "@chakra-ui/react";
import { Dialog } from "../ui/dialog";
import { apiClient } from "../../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LuBrainCircuit } from "react-icons/lu";

interface QuizGenerateModalProps {
  planId: string;
  trigger?: React.ReactNode;
}

export const QuizGenerateModal = ({
  planId,
  trigger,
}: QuizGenerateModalProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState(3);
  const [description, setDescription] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const quiz = await apiClient.generateQuiz(planId, {
        num_questions: numQuestions,
        difficulty,
        description: description || undefined,
      });
      setIsOpen(false);
      toast.success("Quiz generated successfully!");
      navigate(`/quizzes/${quiz.id}`);
    } catch (error) {
      console.error("Failed to generate quiz", error);
      toast.error("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        {trigger || (
          <Button variant="outline">
            <LuBrainCircuit /> Take Quiz
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Generate Quiz</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <VStack gap={4} align="stretch">
            <Box>
              <Text mb={1} fontWeight="medium">
                Number of Questions
              </Text>
              <Input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                min={1}
                max={20}
              />
            </Box>
            <Box>
              <Text mb={1} fontWeight="medium">
                Difficulty (1-5)
              </Text>
              <Input
                type="number"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                min={1}
                max={5}
              />
            </Box>
            <Box>
              <Text mb={1} fontWeight="medium">
                Focus / Description (Optional)
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Focus on Chapter 1"
              />
            </Box>
          </VStack>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.ActionTrigger>
          <Button
            colorPalette="blue"
            onClick={handleGenerate}
            loading={loading}
          >
            Generate & Start
          </Button>
        </Dialog.Footer>
        <Dialog.CloseTrigger />
      </Dialog.Content>
    </Dialog.Root>
  );
};
