import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Stack,
  Container,
  SimpleGrid,
  Spinner,
  Center,
  HStack,
  Icon,
  Avatar,
  Separator,
  VStack,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import { type StudyPlanSummary } from "../lib/types";
import { LuFiles } from "react-icons/lu";
import { PlanCard } from "../components/plans/PlanCard";
import { PlanEmptyState } from "../components/plans/PlanEmptyState";

const UserPlans = () => {
  const { userId } = useParams<{ userId: string }>();
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
          <PlanEmptyState
            title="No public plans"
            description={
              profile?.username
                ? `${profile.username} hasn't published any study plans yet.`
                : "No plans found for this user."
            }
            icon={LuFiles}
          />
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

export default UserPlans;
