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
  Grid,
  GridItem,
  Card,
  Icon,
  Badge,
  Separator,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/api";
import { StudyPlanForm } from "../components/plans/StudyPlanForm";
import { useAuth } from "../hooks/use-auth";
import { type StudyPlanProposal } from "../lib/types";
import { LuSparkles, LuArrowLeft, LuBrainCircuit } from "react-icons/lu";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";

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
  // Key to force re-render of the form when AI updates the proposal
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
      toast.success("Plan generated successfully!");
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Failed to generate plan. Please try again.");
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
      toast.success("Study plan created!");
      navigate(`/plans/${newPlan.id}`);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save study plan.");
    }
  };

  return (
    <Container maxW="container.xl">
      {/* 1. Header Section */}
      <Box mb={4}>
        <Button
          variant="ghost"
          mb={4}
          px={0}
          color="fg.muted"
          _hover={{ color: "fg.DEFAULT" }}
          onClick={() => navigate("/")}
        >
          <HStack gap={2}>
            <LuArrowLeft />
            <Text>Back to Dashboard</Text>
          </HStack>
        </Button>
      </Box>

      {/* 2. Main Layout Grid */}
      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 350px" }}
        gap={{ base: 8, lg: 10 }}
        alignItems="start"
      >
        {/* Left Column: The Form */}
        <GridItem minW={0}>
          <StudyPlanForm
            key={formKey}
            initialData={proposal}
            onSubmit={handleSave}
            submitLabel="Save"
            // We removed the headerActions Popover and moved it to the sidebar
          />
        </GridItem>

        {/* Right Column: AI Assistant Sidebar */}
        <GridItem
          position={{ lg: "sticky" }}
          top={24}
          order={{ base: -1, lg: 0 }} // On mobile, show AI tools first? Or remove to keep it below. Let's keep natural order (Form then AI on mobile) or use order prop.
        >
          <Card.Root
            variant="outline"
            borderColor="purple.200"
            borderWidth={1}
            overflow="hidden"
            css={{ "--card-radius": "var(--radii-lg)" }}
            boxShadow="sm"
          >
            {/* AI Header */}
            <Box
              bg="purple.50"
              p={4}
              borderBottomWidth={1}
              borderColor="purple.100"
              _dark={{ bg: "purple.900/20", borderColor: "purple.800" }}
            >
              <HStack justify="space-between">
                <HStack
                  gap={2}
                  color="purple.600"
                  _dark={{ color: "purple.300" }}
                >
                  <Icon as={LuBrainCircuit} boxSize={5} />
                  <Heading size="sm">AI Architect</Heading>
                </HStack>
                <Badge colorPalette="purple" variant="solid">
                  BETA
                </Badge>
              </HStack>
            </Box>

            {/* AI Controls */}
            <Card.Body gap={5}>
              <Text fontSize="sm" color="fg.muted" lineHeight="tall">
                Describe your learning goals (e.g.,{" "}
                <em>"Master React in 30 days"</em>) and we'll generate sections,
                resources, and a schedule.
              </Text>

              <VStack align="stretch" gap={3}>
                <Textarea
                  placeholder="What do you want to learn today?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  resize="none"
                  borderColor="purple.200"
                  _focus={{ borderColor: "purple.500", outlineWidth: 1 }}
                  _dark={{ borderColor: "purple.800" }}
                  bg="bg.panel"
                />

                <Button
                  size="lg"
                  colorPalette="purple"
                  width="full"
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={!message}
                >
                  <LuSparkles /> Generate Plan
                </Button>
              </VStack>

              <Separator borderColor="border.subtle" />

              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  color="fg.muted"
                  mb={3}
                  letterSpacing="wider"
                >
                  Generation Settings
                </Text>
                <VStack align="start" gap={3}>
                  <Switch
                    checked={ignoreProposal}
                    onCheckedChange={(e) => setIgnoreProposal(e.checked)}
                    size="sm"
                    colorPalette="purple"
                  >
                    <Text fontSize="sm">Ignore current draft</Text>
                  </Switch>
                  <Switch
                    checked={ignoreBasePrompt}
                    onCheckedChange={(e) => setIgnoreBasePrompt(e.checked)}
                    size="sm"
                    colorPalette="purple"
                  >
                    <Text fontSize="sm">Advanced: Ignore base prompt</Text>
                  </Switch>
                </VStack>
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Helper Tip */}
          <HStack
            mt={4}
            p={3}
            bg="blue.50"
            color="blue.700"
            borderRadius="md"
            fontSize="xs"
            _dark={{ bg: "blue.900/20", color: "blue.200" }}
          >
            <Text>
              <strong>Tip:</strong> You can edit the generated plan manually
              before saving.
            </Text>
          </HStack>
        </GridItem>
      </Grid>
    </Container>
  );
}
