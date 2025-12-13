import { useEffect, useState } from "react";
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
  Badge,
} from "@chakra-ui/react";
import { useAuth } from "../hooks/use-auth";
import { apiClient } from "../lib/api";
import { type StudyPlanSummary } from "../lib/types";
import { Link as RouterLink } from "react-router-dom";
import { LuPlus, LuCalendar } from "react-icons/lu";

const Home = () => {
  const { user } = useAuth();
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

  return (
    <Container maxW="6xl" py={8}>
      <Stack gap={8}>
        <HStack justify="space-between" align="center">
          <Heading size="2xl">Home</Heading>
          <RouterLink to="/plans/new">
            <Button colorPalette="teal">
              <LuPlus /> Create New Plan
            </Button>
          </RouterLink>
        </HStack>

        {loading ? (
          <Center py={20}>
            <Spinner size="xl" />
          </Center>
        ) : plans.length === 0 ? (
          <Box
            textAlign="center"
            py={20}
            borderWidth="1px"
            borderStyle="dashed"
            borderRadius="lg"
            borderColor="gray.300"
            _dark={{ borderColor: "gray.700" }}
          >
            <Heading size="md" mb={2}>
              No study plans yet
            </Heading>
            <Text color="gray.500" mb={6}>
              Create your first study plan to get started learning.
            </Text>
            <RouterLink to="/plans/new">
              <Button colorPalette="teal" variant="outline">
                Create Plan
              </Button>
            </RouterLink>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {plans.map((plan) => (
              <Card.Root
                key={plan.id}
                variant="elevated"
                _hover={{
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <Card.Body>
                  <Stack gap={3}>
                    <RouterLink to={`/plans/${plan.id}`}>
                      <Heading
                        size="md"
                        truncate
                        _hover={{ color: "teal.500" }}
                      >
                        {plan.title}
                      </Heading>
                    </RouterLink>
                    <Text
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      lineClamp={2}
                      fontSize="sm"
                    >
                      {plan.description}
                    </Text>
                    <HStack color="gray.500" fontSize="xs" mt={2}>
                      <LuCalendar />
                      <Text>
                        {new Date(plan.created_at).toLocaleDateString()}
                      </Text>
                      {plan.forked_from_id && (
                        <Badge colorPalette="purple" variant="subtle">
                          Forked
                        </Badge>
                      )}
                    </HStack>
                  </Stack>
                </Card.Body>
                <Card.Footer pt={0}>
                  <RouterLink
                    to={`/plans/${plan.id}`}
                    style={{ width: "100%" }}
                  >
                    <Button variant="ghost" size="sm" width="full">
                      View Plan
                    </Button>
                  </RouterLink>
                </Card.Footer>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
};

export default Home;
