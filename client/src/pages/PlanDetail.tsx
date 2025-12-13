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
  Progress,
  Stack,
} from "@chakra-ui/react";
import { useStudyPlan } from "../hooks/use-study-plan";
import { useAuth } from "../hooks/use-auth";
import { StudyPlanTree } from "../components/plans/StudyPlanTree";
import { ResourceItem } from "../components/resources/ResourceItem";
import { LuArrowLeft, LuCopy } from "react-icons/lu";
import { MdEdit } from "react-icons/md";

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, loading, error, forkPlan, toggleResourceStatus } = useStudyPlan(
    id || "",
  );

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

  const progress = plan.progress?.progress ? plan.progress.progress * 100 : 0;

  return (
    <Container maxW="container.xl">
      <Button variant="ghost" mb={6} onClick={() => navigate("/")}>
        <HStack gap={2}>
          <LuArrowLeft />
          <Text>Back</Text>
        </HStack>
      </Button>

      <VStack gap={8} align="stretch">
        <Card.Root>
          <Card.Body>
            <Stack
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align="start"
              mb={4}
              gap={4}
            >
              <VStack align="start" gap={2} flex={1} w="full">
                <Heading size={{ base: "xl", md: "2xl" }}>{plan.title}</Heading>
                <Text color="gray.600" fontSize="lg">
                  {plan.description}
                </Text>
                {plan.progress && (
                  <Box w="full" maxW="md" mt={2}>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        Progress
                      </Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {Math.round(progress)}%
                      </Text>
                    </HStack>
                    <Progress.Root
                      value={progress}
                      size="lg"
                      colorPalette="teal"
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>
                )}
              </VStack>
              {user && plan.user_id === user.id && (
                <HStack w={{ base: "full", md: "auto" }} justify="flex-start">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/plans/${id}/edit`)}
                    title="Edit this plan"
                    flex={{ base: 1, md: "initial" }}
                  >
                    <MdEdit /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    onClick={forkPlan}
                    title="Fork this plan"
                    flex={{ base: 1, md: "initial" }}
                  >
                    <LuCopy /> Fork
                  </Button>
                </HStack>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>

        <Box>
          <Heading size="lg" mb={4}>
            Curriculum
          </Heading>
          <StudyPlanTree
            sections={plan.sections}
            onResourceToggle={toggleResourceStatus}
          />
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
