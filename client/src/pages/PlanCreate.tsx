import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
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
import { Switch } from "../components/ui/switch";

export default function PlanCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [ignoreBasePrompt, setIgnoreBasePrompt] = useState(false);
  const [ignoreProposal, setIgnoreProposal] = useState(false);
  const [proposal, setProposal] = useState<StudyPlanProposal>({
    title: "",
    description: "",
    sections: [],
    resources: [],
  });
  const [formKey, setFormKey] = useState(0);

  const handleGenerate = async () => {
    if (!message) return;
    setIsGenerating(true);
    try {
      const result = await apiClient.generatePlanWithAI({
        ignore_base_prompt: ignoreBasePrompt,
        ignore_proposal: ignoreProposal,
        extra_instructions: message,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <Button
                  variant="outline"
                  color="purple.500"
                  borderColor="purple.500"
                  size="sm"
                  flex={{ base: 1, md: "initial" }}
                >
                  <LuSparkles />
                  Generate
                </Button>
              </Popover.Trigger>
              <Popover.Content width="320px">
                <Popover.Arrow />
                <Popover.Body>
                  <VStack gap={4} align="stretch">
                    <Heading size="sm">AI Assistant</Heading>
                    <Box>
                      <Textarea
                        size="sm"
                        placeholder="Describe what you want to learn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">
                        Options
                      </Text>
                      <VStack align="start" gap={2}>
                        <Switch
                          checked={ignoreProposal}
                          onCheckedChange={(e) => setIgnoreProposal(e.checked)}
                          size="sm"
                        >
                          Ignore current draft
                        </Switch>
                        <Switch
                          checked={ignoreBasePrompt}
                          onCheckedChange={(e) =>
                            setIgnoreBasePrompt(e.checked)
                          }
                          size="sm"
                        >
                          Ignore base prompt
                        </Switch>
                      </VStack>
                    </Box>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={!message}
                    >
                      Generate
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
