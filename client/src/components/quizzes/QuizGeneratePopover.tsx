import { useState } from "react";
import {
  Button,
  VStack,
  Input,
  Textarea,
  Text,
  Box,
  Heading,
  HStack,
} from "@chakra-ui/react";
import { Popover } from "../ui/popover";
import { apiClient } from "../../lib/api";
import { type StudyPlan } from "../../lib/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LuBrainCircuit } from "react-icons/lu";

interface QuizGeneratePopoverProps {
  planId: string;
  studyPlan: StudyPlan;
  trigger?: React.ReactNode;
}

export const QuizGeneratePopover = ({
  planId,
  studyPlan,
  trigger,
}: QuizGeneratePopoverProps) => {
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
        ignore_base_prompt: false,
        study_plan: studyPlan,
        num_questions: numQuestions,
        difficulty,
        extra_instructions: description,
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
    <Popover.Root
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      positioning={{ placement: "bottom-end" }}
    >
      <Popover.Trigger asChild>
        {trigger || (
          <Button variant="outline">
            <LuBrainCircuit /> Take Quiz
          </Button>
        )}
      </Popover.Trigger>
      <Popover.Content width="275px">
        <Popover.Arrow />
        <Popover.Body>
          <VStack gap={4} align="stretch">
            <Heading size="sm">Generate Quiz</Heading>
            <HStack justify="space-between">
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Number of Questions
              </Text>
              <Input
                width="80px"
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                min={1}
                max={20}
              />
            </HStack>
            <HStack justify="space-between">
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Difficulty (1-10)
              </Text>
              <Input
                width="80px"
                type="number"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                min={1}
                max={10}
              />
            </HStack>
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Focus / Description (Optional)
              </Text>
              <Textarea
                size="sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Focus on Chapter 1"
                rows={3}
              />
            </Box>
            <Button
              size="sm"
              variant="outline"
              colorPalette="purple"
              onClick={handleGenerate}
              loading={loading}
            >
              Start
            </Button>
          </VStack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
};
