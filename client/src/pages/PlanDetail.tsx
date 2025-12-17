import { useParams, useNavigate, Link } from "react-router-dom";
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
  Grid,
  GridItem,
  Separator,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { useStudyPlan } from "../hooks/use-study-plan";
import { useAuth } from "../hooks/use-auth";
import { StudyPlanTree } from "../components/plans/StudyPlanTree";
import { ResourceItem } from "../components/resources/ResourceItem";
import {
  LuArrowLeft,
  LuCopy,
  LuBrainCircuit,
  LuList,
  LuTrash2,
  LuBookOpen,
  LuSettings,
  LuFileText,
} from "react-icons/lu";
import { MdEdit } from "react-icons/md";
import { QuizGeneratePopover } from "../components/quizzes/QuizGeneratePopover";
import { apiClient } from "../lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { StudyPlanWithProgress } from "@/lib/types";

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, loading, error, forkPlan, toggleResourceStatus } = useStudyPlan(
    id || "",
  );

  const [forked, setForked] = useState<StudyPlanWithProgress | null>(null);
  useEffect(() => {
    const fetchForked = async () => {
      if (!plan || !plan.forked_from_id) return;
      try {
        const fetched = await apiClient.getStudyPlan(plan.forked_from_id);
        setForked(fetched);
      } catch (err) {
        console.error("Failed to fetch forked plan", err);
      }
    }
    fetchForked();
  }, [plan?.forked_from_id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this study plan?")) return;
    try {
      await apiClient.deleteStudyPlan(id);
      toast.success("Study plan deleted");
      navigate("/");
    } catch (err) {
      console.error("Failed to delete study plan", err);
      toast.error("Failed to delete study plan");
    }
  };

  if (loading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error || !plan) {
    return (
      <Container py={20} textAlign="center">
        <VStack gap={4}>
          <Icon as={LuFileText} size="2xl" color="gray.300" />
          <Heading size="md" color="fg.muted">
            Plan not found
          </Heading>
          <Button variant="outline" onClick={() => navigate("/")}>
            Return Home
          </Button>
        </VStack>
      </Container>
    );
  }

  const progress = plan.progress?.progress ? plan.progress.progress * 100 : 0;
  const isOwner = user?.id === plan.user_id;

  return (
    <Container maxW="container.xl">
      {/* 1. HEADER NAV */}
      <Button
        variant="ghost"
        mb={8}
        color="fg.muted"
        _hover={{ color: "fg.DEFAULT" }}
        onClick={() => navigate("/")}
        px={0}
      >
        <LuArrowLeft /> Back to Dashboard
      </Button>

      <Grid
        templateColumns={{ base: "1fr", lg: "3fr 1.2fr" }}
        gap={{ base: 8, lg: 10 }}
        alignItems="start"
      >
        {/* 2. LEFT COLUMN: CONTENT & SYLLABUS */}
        <GridItem minW={0}>
          <VStack align="stretch" gap={8}>
            {/* Header Info */}
            <Box>
              {plan.forked_from_id && (
                 <Link to={`/plans/${plan.forked_from_id}`}>
                  <Badge mb={4} variant="outline" colorPalette="purple">
                    Forked from: {forked ? forked.title : plan.forked_from_id}
                  </Badge>
                </Link>
              )}
              <Heading
                size={{ base: "2xl", md: "3xl", lg: "4xl" }}
                letterSpacing="tight"
                lineHeight="1.1"
                mb={4}
                wordBreak="break-word"
              >
                {plan.title}
              </Heading>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="fg.muted"
                lineHeight="tall"
              >
                {plan.description}
              </Text>
            </Box>

            <Separator />

            {/* Syllabus Tree */}
            <Box>
              <HStack mb={6} color="fg.muted">
                <LuBookOpen />
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Curriculum Syllabus
                </Text>
              </HStack>

              <StudyPlanTree
                sections={plan.sections}
                onResourceToggle={toggleResourceStatus}
              />
            </Box>
          </VStack>
        </GridItem>

        {/* 3. RIGHT COLUMN: SIDEBAR DASHBOARD */}
        <GridItem position={{ lg: "sticky" }} top={24}>
          <VStack align="stretch" gap={6}>
            {user && (
              <>
                {/* A. Progress & Assessment Card */}
                <Card.Root variant="outline">
                  <Card.Body gap={5}>
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">Course Progress</Text>
                        <Text fontWeight="bold" color="blue.600">
                          {Math.round(progress)}%
                        </Text>
                      </HStack>
                      <Progress.Root
                        value={progress}
                        size="md"
                        colorPalette="blue"
                      >
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                    </VStack>

                    <Separator borderColor="border.subtle" />

                    <VStack align="stretch" gap={3}>
                      <QuizGeneratePopover
                        planId={id || ""}
                        studyPlan={plan}
                        trigger={
                          <Button
                            variant="outline"
                            colorPalette="blue"
                            width="full"
                            size="lg"
                          >
                            <LuBrainCircuit /> Take Quiz
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        colorPalette="green"
                        width="full"
                        onClick={() => navigate(`/plans/${id}/quizzes`)}
                      >
                        <LuList /> View Past Quizzes
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
                {/* B. Management Card */}
                <Card.Root variant="subtle">
                  <Card.Body>
                    <HStack mb={4} color="fg.muted">
                      <LuSettings />
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                      >
                        Manage
                      </Text>
                    </HStack>

                    <VStack align="stretch" gap={1}>
                      {isOwner && (
                        <>
                          <Button
                            variant="ghost"
                            justifyContent="start"
                            onClick={() => navigate(`/plans/${id}/edit`)}
                          >
                            <MdEdit /> Edit Syllabus
                          </Button>
                          <Button
                            variant="ghost"
                            colorPalette="red"
                            justifyContent="start"
                            onClick={handleDelete}
                            _hover={{ bg: "red.50", color: "red.600" }}
                          >
                            <LuTrash2 /> Delete Plan
                          </Button>
                          <Separator my={2} />
                        </>
                      )}
                      <Button
                        variant="ghost"
                        justifyContent="start"
                        onClick={forkPlan}
                      >
                        <LuCopy /> Fork this Plan
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </>
            )}

            {/* C. General Resources */}
            {plan.resources && plan.resources.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={3} fontSize="sm" color="fg.muted">
                  GENERAL RESOURCES
                </Text>
                <VStack align="stretch" gap={2}>
                  {plan.resources.map((resource) => (
                    <ResourceItem key={resource.id} resource={resource} />
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
}
