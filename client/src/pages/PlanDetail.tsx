import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  Spinner,
  Center,
  Card,
} from "@chakra-ui/react";
import { useStudyPlan } from "../hooks/use-study-plan";
import { StudyPlanTree } from "../components/plans/StudyPlanTree";
import { ResourceItem } from "../components/resources/ResourceItem";
import { LuArrowLeft, LuCopy } from "react-icons/lu";

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plan, loading, error, forkPlan } = useStudyPlan(id || "");

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error || !plan) {
    return (
      <Container py={12} textAlign="center">
        <Text color="red.500">Error loading plan</Text>
        <Button mt={4} onClick={() => navigate("/")}>
          Go Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Button variant="ghost" mb={6} onClick={() => navigate("/")}>
        <HStack gap={2}>
          <LuArrowLeft />
          <Text>Back</Text>
        </HStack>
      </Button>

      <VStack gap={8} align="stretch">
        <Card.Root>
          <Card.Body>
            <HStack justify="space-between" align="start" mb={4}>
              <VStack align="start" gap={2}>
                <Heading size="2xl">{plan.title}</Heading>
                <Text color="gray.600" fontSize="lg">
                  {plan.description}
                </Text>
              </VStack>
              <Button
                variant="outline"
                onClick={forkPlan}
                title="Fork this plan"
              >
                <LuCopy /> Fork
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Box>
          <Heading size="lg" mb={4}>
            Curriculum
          </Heading>
          <StudyPlanTree sections={plan.sections} />
        </Box>

        {plan.resources && plan.resources.length > 0 && (
          <Box>
            <Heading size="lg" mb={4}>
              General Resources
            </Heading>
            <VStack align="stretch" gap={2}>
              {plan.resources.map((resource) => (
                <ResourceItem key={resource.id} resource={resource} />
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
