import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Container,
  SimpleGrid,
  Card,
  Button,
  Spinner,
  Center,
  HStack,
  Icon,
  Badge,
  Separator,
} from "@chakra-ui/react";
import { useAuth } from "../hooks/use-auth";
import { apiClient } from "../lib/api";
import { type StudyPlanSummary } from "../lib/types";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  LuPlus,
  LuBookOpen,
  LuClock,
  LuArrowRight,
  LuLayoutDashboard,
  LuGitFork,
} from "react-icons/lu";

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
          <EmptyState />
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

// --- SUB COMPONENTS ---

function PlanCard({ plan, index }: { plan: StudyPlanSummary; index: number }) {
  // Generate a consistent subtle color based on index
  const colors = ["blue", "purple", "cyan", "indigo"];
  const theme = colors[index % colors.length];

  return (
    <Card.Root
      variant="outline"
      overflow="hidden"
      borderColor="border.subtle"
      transition="all 0.2s"
      _hover={{
        borderColor: `${theme}.300`,
        shadow: "sm",
        transform: "translateY(-2px)",
      }}
    >
      <Card.Body gap={4} h="full" display="flex" flexDirection="column">
        <HStack justify="space-between" align="start">
          <Box
            p={2.5}
            bg={`${theme}.50`}
            color={`${theme}.600`}
            borderRadius="lg"
          >
            <Icon as={LuBookOpen} size="lg" />
          </Box>
          {plan.forked_from_id && (
            <Badge variant="surface" colorPalette="purple">
              <LuGitFork /> Forked
            </Badge>
          )}
        </HStack>

        <Stack gap={2} flex="1">
          <RouterLink to={`/plans/${plan.id}`}>
            <Heading
              size="md"
              fontWeight="bold"
              lineClamp={2}
              _hover={{ color: `${theme}.600` }}
            >
              {plan.title}
            </Heading>
          </RouterLink>
          <Text color="fg.muted" fontSize="sm" lineClamp={3}>
            {plan.description || "No description provided."}
          </Text>
        </Stack>

        <HStack
          mt="auto"
          pt={4}
          borderTopWidth="1px"
          borderColor="border.subtle"
          justify="space-between"
          color="fg.muted"
          fontSize="xs"
        >
          <HStack>
            <LuClock />
            <Text>{new Date(plan.created_at).toLocaleDateString()}</Text>
          </HStack>

          <RouterLink to={`/plans/${plan.id}`}>
            <Button variant="ghost" size="xs" colorPalette={theme} gap={1}>
              Open Plan <LuArrowRight />
            </Button>
          </RouterLink>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

function EmptyState() {
  return (
    <Center py={20}>
      <Card.Root
        variant="outline"
        borderStyle="dashed"
        maxW="md"
        w="full"
        textAlign="center"
        p={8}
      >
        <Center mb={6}>
          <Box p={4} bg="gray.50" borderRadius="full" color="gray.400">
            <LuBookOpen size={48} />
          </Box>
        </Center>
        <Heading size="lg" mb={2}>
          Start Your Journey
        </Heading>
        <Text color="fg.muted" mb={8}>
          You don't have any study plans yet. Create one with AI to get a
          structured syllabus, quizzes, and resources.
        </Text>
        <RouterLink to="/plans/new">
          <Button colorPalette="blue" variant="outline" size="lg" width="full">
            Create First Plan
          </Button>
        </RouterLink>
      </Card.Root>
    </Center>
  );
}

export default Home;
