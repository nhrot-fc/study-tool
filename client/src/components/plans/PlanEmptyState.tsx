import {
  Center,
  Card,
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { LuBookOpen } from "react-icons/lu";

interface PlanEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  icon?: React.ElementType;
}

export const PlanEmptyState = ({
  title,
  description,
  actionLabel,
  actionLink,
  icon = LuBookOpen,
}: PlanEmptyStateProps) => {
  if (actionLabel && actionLink) {
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
            <Box
              p={4}
              bg="gray.50"
              borderRadius="full"
              color="gray.400"
              _dark={{ bg: "gray.800" }}
            >
              <Icon as={icon} fontSize="48px" />
            </Box>
          </Center>
          <Heading size="lg" mb={2}>
            {title}
          </Heading>
          <Text color="fg.muted" mb={8}>
            {description}
          </Text>
          <RouterLink to={actionLink}>
            <Button
              colorPalette="blue"
              variant="outline"
              size="lg"
              width="full"
            >
              {actionLabel}
            </Button>
          </RouterLink>
        </Card.Root>
      </Center>
    );
  }

  return (
    <Center py={16}>
      <VStack gap={4} textAlign="center" color="fg.muted">
        <Icon as={icon} fontSize="48px" opacity={0.3} />
        <Heading size="md" color="fg.DEFAULT">
          {title}
        </Heading>
        <Text maxW="sm">{description}</Text>
      </VStack>
    </Center>
  );
};
