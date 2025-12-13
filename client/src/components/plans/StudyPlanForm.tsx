import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Textarea,
  Button,
  Text,
  IconButton,
  Collapsible,
  Select,
  Card,
  Separator,
  Heading,
  createListCollection,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuTrash2,
  LuChevronRight,
  LuChevronDown,
  LuFileText,
  LuLink,
  LuBook,
  LuVideo,
} from "react-icons/lu";
import {
  type SectionUpsert,
  type ResourceUpsert,
  type ResourceType,
} from "../../lib/types";
import type { IconType } from "react-icons";

interface StudyPlanFormProps {
  initialData?: {
    title: string;
    description: string;
    sections: SectionUpsert[];
  };
  onSubmit: (data: {
    title: string;
    description: string;
    sections: SectionUpsert[];
  }) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const RESOURCE_TYPES: { value: ResourceType; label: string; icon: IconType }[] =
  [
    { value: "video", label: "Video", icon: LuVideo },
    { value: "article", label: "Article", icon: LuFileText },
    { value: "book", label: "Book", icon: LuBook },
    { value: "blog", label: "Blog", icon: LuFileText },
    { value: "documentation", label: "Documentation", icon: LuFileText },
    { value: "repository", label: "Repository", icon: LuLink },
  ];

const resourceTypeCollection = createListCollection({
  items: RESOURCE_TYPES,
});

const ResourceEditor = ({
  resource,
  onChange,
  onDelete,
}: {
  resource: ResourceUpsert;
  onChange: (resource: ResourceUpsert) => void;
  onDelete: () => void;
}) => {
  return (
    <Card.Root size="sm" variant="subtle">
      <Card.Body p={3}>
        <VStack gap={3} align="stretch">
          <HStack gap={2}>
            <Select.Root
              size="sm"
              width="140px"
              collection={resourceTypeCollection}
              value={[resource.type]}
              onValueChange={(e) =>
                onChange({ ...resource, type: e.value[0] as ResourceType })
              }
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Type" />
              </Select.Trigger>
              <Select.Content>
                {resourceTypeCollection.items.map((type) => (
                  <Select.Item key={type.value} item={type}>
                    {type.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Input
              size="sm"
              placeholder="Resource Title"
              value={resource.title}
              onChange={(e) => onChange({ ...resource, title: e.target.value })}
            />
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={onDelete}
              aria-label="Delete resource"
            >
              <LuTrash2 />
            </IconButton>
          </HStack>
          <Input
            size="sm"
            placeholder="URL"
            value={resource.url}
            onChange={(e) => onChange({ ...resource, url: e.target.value })}
          />
          <Textarea
            size="sm"
            placeholder="Description (optional)"
            rows={2}
            value={resource.description || ""}
            onChange={(e) =>
              onChange({ ...resource, description: e.target.value })
            }
          />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

const SectionEditor = ({
  section,
  onChange,
  onDelete,
  depth = 0,
}: {
  section: SectionUpsert;
  onChange: (section: SectionUpsert) => void;
  onDelete: () => void;
  depth?: number;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleUpdate = (updates: Partial<SectionUpsert>) => {
    onChange({ ...section, ...updates });
  };

  const addResource = () => {
    const newResource: ResourceUpsert = {
      title: "",
      url: "",
      type: "article",
      description: "",
    };
    handleUpdate({ resources: [...section.resources, newResource] });
  };

  const updateResource = (index: number, updated: ResourceUpsert) => {
    const newResources = [...section.resources];
    newResources[index] = updated;
    handleUpdate({ resources: newResources });
  };

  const deleteResource = (index: number) => {
    handleUpdate({
      resources: section.resources.filter((_, i) => i !== index),
    });
  };

  const addChildSection = () => {
    const newSection: SectionUpsert = {
      title: "",
      description: "",
      order: section.children.length,
      resources: [],
      children: [],
    };
    handleUpdate({ children: [...section.children, newSection] });
  };

  const updateChildSection = (index: number, updated: SectionUpsert) => {
    const newChildren = [...section.children];
    newChildren[index] = updated;
    handleUpdate({ children: newChildren });
  };

  const deleteChildSection = (index: number) => {
    handleUpdate({
      children: section.children.filter((_, i) => i !== index),
    });
  };

  return (
    <Box
      pl={depth > 0 ? 4 : 0}
      borderLeftWidth={depth > 0 ? "1px" : 0}
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700" }}
    >
      <VStack align="stretch" gap={2} py={2}>
        <HStack gap={2} align="start">
          <IconButton
            size="xs"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Collapse" : "Expand"}
            mt={1}
          >
            {isOpen ? <LuChevronDown /> : <LuChevronRight />}
          </IconButton>

          <VStack align="stretch" flex={1} gap={2}>
            <HStack>
              <Input
                placeholder="Section Title"
                fontWeight="semibold"
                value={section.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
              />
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={onDelete}
                aria-label="Delete section"
              >
                <LuTrash2 />
              </IconButton>
            </HStack>
            <Textarea
              placeholder="Section Description (optional)"
              size="sm"
              rows={2}
              value={section.description || ""}
              onChange={(e) => handleUpdate({ description: e.target.value })}
            />
          </VStack>
        </HStack>

        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <VStack align="stretch" gap={4} pl={9} mt={2}>
              {/* Resources */}
              <VStack align="stretch" gap={2}>
                {section.resources.map((resource, index) => (
                  <ResourceEditor
                    key={index}
                    resource={resource}
                    onChange={(updated) => updateResource(index, updated)}
                    onDelete={() => deleteResource(index)}
                  />
                ))}
                <Button
                  size="xs"
                  variant="outline"
                  onClick={addResource}
                  alignSelf="start"
                >
                  <LuPlus /> Add Resource
                </Button>
              </VStack>

              <Separator />

              {/* Children Sections */}
              <VStack align="stretch" gap={2}>
                {section.children.map((child, index) => (
                  <SectionEditor
                    key={index}
                    section={child}
                    onChange={(updated) => updateChildSection(index, updated)}
                    onDelete={() => deleteChildSection(index)}
                    depth={depth + 1}
                  />
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addChildSection}
                  alignSelf="start"
                >
                  <LuPlus /> Add Sub-section
                </Button>
              </VStack>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </VStack>
    </Box>
  );
};

export const StudyPlanForm = ({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = "Save Plan",
}: StudyPlanFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [sections, setSections] = useState<SectionUpsert[]>(
    initialData?.sections || [],
  );

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: "",
        description: "",
        order: sections.length,
        resources: [],
        children: [],
      },
    ]);
  };

  const updateSection = (index: number, updated: SectionUpsert) => {
    const newSections = [...sections];
    newSections[index] = updated;
    setSections(newSections);
  };

  const deleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const reindexSections = (sections: SectionUpsert[]): SectionUpsert[] => {
    return sections.map((section, index) => ({
      ...section,
      order: index,
      children: reindexSections(section.children),
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      sections: reindexSections(sections),
    });
  };

  return (
    <VStack align="stretch" gap={6} w="full" maxW="4xl" mx="auto">
      <Card.Root>
        <Card.Header>
          <Heading size="md">Study Plan Details</Heading>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            <Box>
              <Text mb={1} fontWeight="medium">
                Title
              </Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Python Mastery"
              />
            </Box>
            <Box>
              <Text mb={1} fontWeight="medium">
                Description
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this study plan about?"
                rows={3}
              />
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <HStack justify="space-between">
            <Heading size="sm">Plan Structure</Heading>
            <Button size="sm" onClick={addSection}>
              <LuPlus /> Add Section
            </Button>
          </HStack>
        </Card.Header>
        <Card.Body>
          <VStack align="stretch" gap={4}>
            {sections.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No sections added yet. Start by adding a section.
              </Text>
            ) : (
              sections.map((section, index) => (
                <SectionEditor
                  key={index}
                  section={section}
                  onChange={(updated) => updateSection(index, updated)}
                  onDelete={() => deleteSection(index)}
                />
              ))
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <Button
        size="lg"
        colorPalette="blue"
        onClick={handleSubmit}
        loading={isLoading}
      >
        {submitLabel}
      </Button>
    </VStack>
  );
};
