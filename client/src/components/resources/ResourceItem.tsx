import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Link,
  Icon,
  Checkbox,
} from "@chakra-ui/react";
import { LuFileText, LuVideo, LuBook, LuExternalLink } from "react-icons/lu";
import type { Resource, ResourceType } from "../../lib/types";
import { useAuth } from "@/hooks/use-auth";

const ResourceIcon = ({ type }: { type: ResourceType }) => {
  switch (type) {
    case "video":
      return <Icon as={LuVideo} />;
    case "book":
      return <Icon as={LuBook} />;
    default:
      return <Icon as={LuFileText} />;
  }
};

interface ResourceItemProps {
  resource: Resource;
  onToggle?: () => void;
}

export const ResourceItem = ({ resource, onToggle }: ResourceItemProps) => {
  const { user } = useAuth();
  return (
    <HStack
      p={2}
      borderWidth="1px"
      borderRadius="md"
      _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}
      width="full"
      align="start"
      bg={resource.status === "completed" ? "green.50" : undefined}
      _dark={{
        bg: resource.status === "completed" ? "green.900/20" : undefined,
      }}
    >
      {user && onToggle && (
        <Checkbox.Root
          checked={resource.status === "completed"}
          onCheckedChange={onToggle}
          mt={1}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      )}
      <Box color="gray.500" mt={1}>
        <ResourceIcon type={resource.type} />
      </Box>
      <VStack align="start" gap={0} flex={1}>
        <Link
          href={resource.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          fontWeight="medium"
          fontSize="sm"
          lineHeight="short"
          textDecoration={
            resource.status === "completed" ? "line-through" : "none"
          }
          color={resource.status === "completed" ? "gray.500" : undefined}
        >
          {resource.title}{" "}
          {resource.url && (
            <Icon as={LuExternalLink} boxSize={3} display="inline" />
          )}
        </Link>
        {resource.description && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>
            {resource.description}
          </Text>
        )}
      </VStack>
      {resource.duration_minutes && (
        <Badge variant="subtle" size="sm">
          {resource.duration_minutes} min
        </Badge>
      )}
    </HStack>
  );
};
