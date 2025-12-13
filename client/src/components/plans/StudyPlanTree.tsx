import { useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Button,
  Collapsible,
} from "@chakra-ui/react";
import {
  LuChevronRight,
  LuChevronDown,
  LuCheckCheck,
  LuCircle,
  LuClock,
  LuBan,
} from "react-icons/lu";
import type { Section, CompletionStatus } from "../../lib/types";
import { ResourceItem } from "../resources/ResourceItem";

interface StudyPlanTreeProps {
  sections: Section[];
  onResourceToggle?: (
    sectionId: string,
    resourceId: string,
    currentStatus: CompletionStatus,
  ) => void;
}

const StatusIcon = ({ status }: { status?: CompletionStatus }) => {
  if (!status) return <Icon as={LuCircle} color="gray.300" />;

  switch (status) {
    case "completed":
      return <Icon as={LuCheckCheck} color="green.500" />;
    case "in_progress":
      return <Icon as={LuClock} color="blue.500" />;
    case "skipped":
      return <Icon as={LuBan} color="orange.500" />;
    default:
      return <Icon as={LuCircle} color="gray.300" />;
  }
};

const SectionNode = ({
  section,
  depth = 0,
  onResourceToggle,
}: {
  section: Section;
  depth?: number;
  onResourceToggle?: (
    sectionId: string,
    resourceId: string,
    currentStatus: CompletionStatus,
  ) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = section.children && section.children.length > 0;
  const hasResources = section.resources && section.resources.length > 0;
  const isEmpty = !hasChildren && !hasResources;

  return (
    <Box
      pl={depth > 0 ? 4 : 0}
      borderLeftWidth={depth > 0 ? "1px" : 0}
      borderColor="gray.200"
    >
      <VStack align="stretch" gap={2} py={2}>
        <HStack gap={2}>
          {!isEmpty && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Collapse" : "Expand"}
              p={0}
              minW="auto"
            >
              <Icon as={isOpen ? LuChevronDown : LuChevronRight} />
            </Button>
          )}
          {isEmpty && <Box w={4} />} {/* Spacer for alignment */}
          <StatusIcon status={section.status} />
          <VStack align="start" gap={0} flex={1}>
            <Text fontWeight="semibold" fontSize="md">
              {section.title}
            </Text>
            {section.description && (
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: "gray.400" }}
              >
                {section.description}
              </Text>
            )}
          </VStack>
        </HStack>

        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <VStack align="stretch" gap={3} pl={9} mt={2}>
              {hasResources && (
                <VStack align="stretch" gap={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    color="gray.500"
                  >
                    Resources
                  </Text>
                  {section.resources.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      onToggle={
                        onResourceToggle
                          ? () =>
                              onResourceToggle(
                                section.id,
                                resource.id,
                                resource.status || "not_started",
                              )
                          : undefined
                      }
                    />
                  ))}
                </VStack>
              )}

              {hasChildren && (
                <VStack align="stretch" gap={1}>
                  {section.children.map((child) => (
                    <SectionNode
                      key={child.id}
                      section={child}
                      depth={depth + 1}
                      onResourceToggle={onResourceToggle}
                    />
                  ))}
                </VStack>
              )}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </VStack>
    </Box>
  );
};

export const StudyPlanTree = ({
  sections,
  onResourceToggle,
}: StudyPlanTreeProps) => {
  if (!sections || sections.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        No sections available.
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {sections.map((section) => (
        <SectionNode
          key={section.id}
          section={section}
          onResourceToggle={onResourceToggle}
        />
      ))}
    </VStack>
  );
};
