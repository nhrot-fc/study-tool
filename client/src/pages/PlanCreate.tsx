import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Textarea,
  VStack,
  Text,
  Card,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/api";
import { StudyPlanForm } from "../components/plans/StudyPlanForm";
import { useAuth } from "../hooks/use-auth";
import { type StudyPlanProposal } from "../lib/types";
import { LuSparkles } from "react-icons/lu";

export default function PlanCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<StudyPlanProposal | null>(null);

  const handleGenerate = async () => {
    if (!topic || !message) return;
    setIsGenerating(true);
    try {
      const result = await apiClient.generatePlanWithAI({
        topic,
        message,
        proposal: proposal || undefined,
      });
      setProposal(result);
    } catch (error) {
      console.error("Error generating plan:", error);
      // You might want to add a toast here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!user) return;
    try {
      const planData = {
        ...data,
        resources: proposal?.resources || [], // Preserve top-level resources if any
        user_id: user.id,
      };
      const newPlan = await apiClient.createStudyPlan(planData);
      navigate(`/plans/${newPlan.id}`);
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  if (proposal) {
    return (
      <Container maxW="container.xl" py={8}>
        <Button variant="ghost" mb={4} onClick={() => setProposal(null)}>
          Back to Generator
        </Button>
        <StudyPlanForm initialData={proposal} onSubmit={handleSave} />
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={12}>
      <VStack gap={8} align="stretch">
        <Heading textAlign="center">Create New Study Plan</Heading>

        <Card.Root>
          <Card.Header>
            <HStack gap={2}>
              <LuSparkles />
              <Heading size="sm">Generate with AI</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Box>
                <Text mb={1} fontWeight="medium">
                  Topic
                </Text>
                <Input
                  placeholder="e.g. React, Python, Machine Learning"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={1} fontWeight="medium">
                  Goals & Details
                </Text>
                <Textarea
                  placeholder="Describe what you want to learn, your current level, time availability..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </Box>
              <Button
                colorPalette="blue"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={!topic || !message}
              >
                Generate Plan
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        <HStack justify="center">
          <Text color="gray.500">or</Text>
        </HStack>

        <Button
          variant="outline"
          onClick={() =>
            setProposal({
              title: "",
              description: "",
              sections: [],
              resources: [],
            })
          }
        >
          Create Manually
        </Button>
      </VStack>
    </Container>
  );
}
