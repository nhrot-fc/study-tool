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
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/api";
import { StudyPlanForm } from "../components/plans/StudyPlanForm";
import { useAuth } from "../hooks/use-auth";
import { type StudyPlanProposal } from "../lib/types";
import { LuSparkles, LuArrowLeft } from "react-icons/lu";
import { Popover } from "../components/ui/popover";

export default function PlanCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<StudyPlanProposal>({
    title: "",
    description: "",
    sections: [],
    resources: [],
  });
  const [formKey, setFormKey] = useState(0);

  const handleGenerate = async () => {
    if (!topic || !message) return;
    setIsGenerating(true);
    try {
      const result = await apiClient.generatePlanWithAI({
        topic,
        message,
        proposal,
      });
      setProposal(result);
      setFormKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!user) return;
    try {
      const planData = {
        ...data,
        resources: proposal.resources || [],
        user_id: user.id,
      };
      const newPlan = await apiClient.createStudyPlan(planData);
      navigate(`/plans/${newPlan.id}`);
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  return (
    <Container maxW="container.xl">
      <Button variant="ghost" mb={6} onClick={() => navigate("/")}>
        <HStack gap={2}>
          <LuArrowLeft />
          <Text>Back</Text>
        </HStack>
      </Button>

      <VStack gap={8} align="stretch">
        <StudyPlanForm
          key={formKey}
          initialData={proposal}
          onSubmit={handleSave}
          headerActions={
            <Popover.Root positioning={{ placement: "bottom-end" }}>
              <Popover.Trigger asChild>
                <Button variant="outline" size="sm">
                  <LuSparkles /> Generate with AI
                </Button>
              </Popover.Trigger>
              <Popover.Content width="320px">
                <Popover.Arrow />
                <Popover.Body>
                  <VStack gap={4} align="stretch">
                    <Heading size="sm">AI Assistant</Heading>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">
                        Topic
                      </Text>
                      <Input
                        size="sm"
                        placeholder="e.g. React, Python"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">
                        Goals & Details
                      </Text>
                      <Textarea
                        size="sm"
                        placeholder="Describe what you want to learn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </Box>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={!topic || !message}
                    >
                      Generate Suggestion
                    </Button>
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Root>
          }
        />
      </VStack>
    </Container>
  );
}
