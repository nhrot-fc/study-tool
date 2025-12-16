import { useEffect, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
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
  Avatar,
  Separator,
  VStack,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import { type StudyPlanSummary } from "../lib/types";
import {
  LuCalendar,
  LuBookOpen,
  LuGitFork,
  LuArrowRight,
  LuFiles,
} from "react-icons/lu";

const UserPlans = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlanSummary[]>([]);
  const [profile, setProfile] = useState<{
    username: string;
    full_name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      // Fetch both user profile and their plans
      Promise.all([apiClient.getStudyPlans(userId), apiClient.getUser(userId)])
        .then(([plansData, userData]) => {
          setPlans(plansData);
          setProfile(userData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Container maxW="container.lg" py={12}>
      <Stack gap={10}>
        {/* PROFILE HEADER */}
        {profile && (
          <HStack align="center" gap={6} wrap="wrap">
            <Avatar.Root size="2xl" colorPalette="blue">
              <Avatar.Fallback name={profile.full_name || profile.username} />
              <Avatar.Image />
            </Avatar.Root>
            <VStack align="start" gap={1}>
              <Heading size="3xl" letterSpacing="tight">
                {profile.username}
              </Heading>
              <Text color="fg.muted" fontSize="lg">
                Curator of <strong>{plans.length}</strong> study plans
              </Text>
            </VStack>
          </HStack>
        )}

        <Separator />

        {/* CONTENT GRID */}
        {plans.length === 0 ? (
          <EmptyState username={profile?.username} />
        ) : (
          <Box>
            <HStack mb={6} gap={2} color="fg.muted">
              <Icon as={LuFiles} />
              <Text
                fontWeight="medium"
                textTransform="uppercase"
                fontSize="xs"
                letterSpacing="wider"
              >
                Public Portfolio
              </Text>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
              {plans.map((plan) => (
                <PublicPlanCard
                  key={plan.id}
                  plan={plan}
                  navigation={() => navigate(`/plans/${plan.id}`)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

// --- SUB-COMPONENTS ---

function PublicPlanCard({
  plan,
  navigation,
}: {
  plan: StudyPlanSummary;
  navigation: () => void;
}) {
  return (
    <Card.Root
      variant="outline"
      borderColor="border.subtle"
      transition="all 0.2s"
      _hover={{
        borderColor: "blue.300",
        shadow: "sm",
        transform: "translateY(-2px)",
      }}
    >
      <Card.Body display="flex" flexDirection="column" gap={4} h="full">
        {/* Header: Icon + Fork Badge */}
        <HStack justify="space-between" align="start">
          <Box
            p={2}
            bg="bg.panel"
            borderRadius="md"
            color="fg.subtle"
            border="1px solid"
            borderColor="border.subtle"
          >
            <Icon as={LuBookOpen} size="md" />
          </Box>
          {plan.forked_from_id && (
            <Badge variant="surface" colorPalette="purple" gap={1}>
              <LuGitFork /> Forked
            </Badge>
          )}
        </HStack>

        {/* Content */}
        <Stack gap={2} flex="1">
          <RouterLink to={`/plans/${plan.id}`}>
            <Heading
              size="md"
              fontWeight="bold"
              lineClamp={2}
              _hover={{ textDecoration: "underline" }}
            >
              {plan.title}
            </Heading>
          </RouterLink>
          <Text color="fg.muted" fontSize="sm" lineClamp={3}>
            {plan.description || "No description provided."}
          </Text>
        </Stack>

        {/* Footer: Date + Action */}
        <HStack
          justify="space-between"
          color="fg.muted"
          fontSize="xs"
          pt={4}
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <HStack>
            <LuCalendar />
            <Text>{new Date(plan.created_at).toLocaleDateString()}</Text>
          </HStack>

          <Button
            onClick={navigation}
            variant="ghost"
            size="xs"
            colorPalette="blue"
          >
            View Syllabus <LuArrowRight />
          </Button>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

function EmptyState({ username }: { username?: string }) {
  return (
    <Center py={16}>
      <VStack gap={4} textAlign="center" color="fg.muted">
        <Icon as={LuFiles} size="2xl" opacity={0.3} />
        <Heading size="md" color="fg.DEFAULT">
          No public plans
        </Heading>
        <Text maxW="sm">
          {username
            ? `${username} hasn't published any study plans yet.`
            : "No plans found for this user."}
        </Text>
      </VStack>
    </Center>
  );
}

export default UserPlans;
