import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Center,
  Spinner,
  Text,
  Button,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { apiClient } from "../lib/api";
import { StudyPlanForm } from "../components/plans/StudyPlanForm";
import { type StudyPlanWithProgress, type SectionUpsert } from "../lib/types";
import { toast } from "sonner";
import { LuArrowLeft } from "react-icons/lu";

export default function PlanEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlanWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .getStudyPlan(id)
      .then(setPlan)
      .catch((err) => {
        console.error("Failed to load plan", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (data: {
    title: string;
    description: string;
    sections: SectionUpsert[];
  }) => {
    if (!id) return;
    setSaving(true);
    try {
      await apiClient.updateStudyPlan(id, data);
      toast.success("Plan updated successfully");
      navigate(`/plans/${id}`);
    } catch (err) {
      console.error("Failed to update plan", err);
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

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

  const initialData = {
    title: plan.title,
    description: plan.description,
    sections: plan.sections as unknown as SectionUpsert[],
  };

  return (
    <Container maxW="container.xl">
      <Button variant="ghost" mb={6} onClick={() => navigate(`/plans/${id}`)}>
        <HStack gap={2}>
          <LuArrowLeft />
          <Text>Back</Text>
        </HStack>
      </Button>

      <VStack gap={8} align="stretch">
        <StudyPlanForm
          initialData={initialData}
          onSubmit={handleSave}
          isLoading={saving}
          submitLabel="Update Plan"
        />
      </VStack>
    </Container>
  );
}
