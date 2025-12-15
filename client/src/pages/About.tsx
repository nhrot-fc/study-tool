import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  SimpleGrid,
  Icon,
  Card,
  HStack,
  Separator,
  Button,
} from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  LuBrainCircuit,
  LuBookOpen,
  LuGraduationCap,
  LuZap,
  LuGithub,
  LuLayers,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <Container maxW="container.lg" py={16}>
      <VStack gap={16} align="stretch">
        {/* HERO SECTION */}
        <VStack textAlign="center" gap={6} maxW="2xl" mx="auto">
          <BadgeWrapper>
            <Icon as={LuBrainCircuit} mr={2} /> Powered by Google Gemini
          </BadgeWrapper>
          <Heading size="4xl" letterSpacing="tight" lineHeight="1.1">
            Turn any topic into a <br />
            <Text as="span" color="blue.500">
              university-grade syllabus.
            </Text>
          </Heading>
          <Text fontSize="xl" color="gray.500" lineHeight="tall">
            Stop scrolling through endless tutorials. We use advanced AI to
            structure chaos into clear, linear study plans inspired by curricula
            from top institutions like MIT and Oxford.
          </Text>
        </VStack>

        {/* METHODOLOGY GRID */}
        <Box>
          <Heading size="lg" mb={8} textAlign="center">
            How it Works
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            <FeatureCard
              icon={LuLayers}
              title="Structured Learning"
              description="We break down complex subjects into chapters, references, and sub-chapters. No fluff, just a logical progression of knowledge."
            />
            <FeatureCard
              icon={LuGraduationCap}
              title="Academic Rigor"
              description="Our AI is prompt-engineered to act as a Curriculum Designer, referencing standard textbooks and avoiding generic internet summaries."
            />
            <FeatureCard
              icon={LuZap}
              title="Active Recall"
              description="Test your mastery with quizzes generated using Bloom's Taxonomy—moving beyond simple definitions to analysis and problem-solving."
            />
          </SimpleGrid>
        </Box>

        <Separator />

        {/* TECH STACK SECTION (Honest representation of the repo) */}
        <Box>
          <Heading size="lg" mb={8}>
            Built with Modern Tech
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
            <Box>
              <Text fontSize="lg" color="gray.600" mb={4}>
                This application is an open-source educational wrapper designed
                to harness the reasoning capabilities of Large Language Models
                (LLMs) for structured pedagogy.
              </Text>
              <VStack align="start" gap={3}>
                <TechItem
                  label="Frontend"
                  value="React + TypeScript + Chakra UI"
                />
                <TechItem label="Backend" value="FastAPI (Python) + Pydantic" />
                <TechItem
                  label="Intelligence"
                  value="Google Gemini 1.5 Flash"
                />
                <TechItem
                  label="Architecture"
                  value="Modular Service Pattern"
                />
              </VStack>
            </Box>

            {/* Context/Philosophy */}
            <Card.Root variant="subtle">
              <Card.Body>
                <VStack align="start" gap={4}>
                  <Icon as={LuBookOpen} size="lg" color="blue.500" />
                  <Heading size="md">Why this exists?</Heading>
                  <Text>
                    Self-learning is hard because the roadmap is often missing.
                    Search engines give you answers, but not a <i>path</i>. This
                    tool bridges the gap between raw information and a
                    structured classroom experience.
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        "https://github.com/nhrot-fc/study-tool",
                        "_blank",
                      )
                    }
                  >
                    <LuGithub /> View Source Code
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Box>

        {/* CTA */}
        <Box textAlign="center" py={10}>
          <Heading size="xl" mb={6}>
            Ready to start learning?
          </Heading>
          <Button
            size="xl"
            colorPalette="blue"
            onClick={() => navigate("/home")}
          >
            Create your First Plan
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}

// --- SUBCOMPONENTS ---

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <Card.Root
      variant="outline"
      borderColor="transparent"
      bg="bg.panel"
      shadow="sm"
    >
      <Card.Body>
        <VStack align="start" gap={4}>
          <Box p={3} bg="blue.50" color="blue.600" borderRadius="lg">
            <Icon as={icon} size="lg" />
          </Box>
          <Heading size="md">{title}</Heading>
          <Text color="fg.muted" lineHeight="tall">
            {description}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function TechItem({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      width="full"
      justify="space-between"
      borderBottomWidth="1px"
      borderColor="gray.100"
      py={2}
    >
      <Text fontWeight="medium" color="gray.500">
        {label}
      </Text>
      <Text fontWeight="semibold">{value}</Text>
    </HStack>
  );
}

function BadgeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      px={3}
      py={1}
      borderRadius="full"
      bg="blue.50"
      color="blue.700"
      fontWeight="semibold"
      fontSize="sm"
    >
      {children}
    </Box>
  );
}
