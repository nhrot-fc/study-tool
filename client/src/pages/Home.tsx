import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Container,
  SimpleGrid,
  Button,
  Spinner,
  Center,
  HStack,
  Icon,
  Separator,
} from "@chakra-ui/react";
import { useAuth } from "../hooks/use-auth";
import { apiClient } from "../lib/api";
import { type StudyPlanSummary } from "../lib/types";
import { useNavigate } from "react-router-dom";
import { LuPlus, LuLayoutDashboard } from "react-icons/lu";
import { PlanCard } from "../components/plans/PlanCard";
import { PlanEmptyState } from "../components/plans/PlanEmptyState";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      apiClient
        .getStudyPlans(user.id)
        .then(setPlans)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  // Derived state for a quick stats view
  const stats = useMemo(() => {
    return {
      totalPlans: plans.length,
      recent: plans.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0],
    };
  }, [plans]);

  if (loading) {
    return (
      <Center h="80vh">
        <Spinner
          size="xl"
          color="blue.500"
          css={{ "--spinner-track-color": "colors.gray.200" }}
        />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl">
      <Stack gap={10}>
        {/* DASHBOARD HEADER */}
        <Stack gap={6}>
          <HStack
            justify="space-between"
            align="flex-start"
            wrap="wrap"
            gap={4}
          >
            <Box>
              <Heading size="3xl" letterSpacing="tight" mb={2}>
                Welcome back, {user?.username?.split(" ")[0] || "Scholar"}
              </Heading>
              <Text color="fg.muted" fontSize="lg">
                You have <strong>{stats.totalPlans} active study plans</strong>.
                {stats.recent && " Ready to continue where you left off?"}
              </Text>
            </Box>
            <Button
              size="lg"
              colorPalette="blue"
              variant="outline"
              onClick={() => navigate("/plans/new")}
            >
              <LuPlus /> New Study Plan
            </Button>
          </HStack>
          <Separator />
        </Stack>

        {/* CONTENT AREA */}
        {plans.length === 0 ? (
          <PlanEmptyState
            title="Start Your Journey"
            description="You don't have any study plans yet. Create one with AI to get a structured syllabus, quizzes, and resources."
            actionLabel="Create First Plan"
            actionLink="/plans/new"
          />
        ) : (
          <Box>
            <HStack mb={6} gap={2} color="fg.muted">
              <Icon as={LuLayoutDashboard} />
              <Text
                fontWeight="medium"
                textTransform="uppercase"
                fontSize="xs"
                letterSpacing="wider"
              >
                Your Curriculum
              </Text>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {plans.map((plan, index) => (
                <PlanCard key={plan.id} plan={plan} index={index} />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default Home;
