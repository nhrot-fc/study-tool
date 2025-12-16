import {
  Box,
  Heading,
  Text,
  Stack,
  Card,
  Button,
  HStack,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { LuBookOpen, LuClock, LuArrowRight, LuGitFork } from "react-icons/lu";
import { type StudyPlanSummary } from "../../lib/types";

interface PlanCardProps {
  plan: StudyPlanSummary;
  index?: number;
}

export const PlanCard = ({ plan, index = 0 }: PlanCardProps) => {
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
            _dark={{ bg: `${theme}.900`, color: `${theme}.200` }}
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
};
