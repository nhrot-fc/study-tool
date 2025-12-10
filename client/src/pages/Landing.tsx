import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  Stack,
  Button,
  Container,
  Card,
} from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { FaRocket, FaBook, FaChartLine, FaUsers } from "react-icons/fa";

const Feature = ({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: IconType;
}) => {
  return (
    <Card.Root>
      <Card.Body>
        <Stack gap={4} align="center" textAlign="center">
          <Box p={3} bg="teal.100" color="teal.600" borderRadius="full">
            <Icon fontSize="2xl" as={icon} />
          </Box>
          <Heading size="md">{title}</Heading>
          <Text color="gray.500">{text}</Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

const Landing = () => {
  return (
    <Container maxW="6xl">
      <Stack gap={12}>
        {/* Hero Section */}
        <Box textAlign="center" py={10} px={6}>
          <Heading
            as="h1"
            size="4xl"
            mt={10}
            mb={6}
            fontWeight="bold"
            letterSpacing="tight"
          >
            Supercharge Your{" "}
            <Text as="span" color="teal.500">
              Learning
            </Text>
          </Heading>
          <Text color="gray.500" fontSize="xl" maxW="2xl" mx="auto" mb={10}>
            The ultimate study tool designed to help you master any subject.
            Organize your tasks, track your progress, and collaborate with
            peers.
          </Text>
          <Stack direction="row" gap={4} justify="center">
            <Button size="xl" colorPalette="teal">
              Get Started
            </Button>
            <Button size="xl" variant="outline">
              Learn More
            </Button>
          </Stack>
        </Box>

        {/* Features Grid */}
        <Box>
          <Heading size="xl" mb={8} textAlign="center">
            Why Choose Us?
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={8}>
            <Feature
              icon={FaRocket}
              title="Fast Learning"
              text="Optimized algorithms to help you learn faster and retain more."
            />
            <Feature
              icon={FaBook}
              title="Organized Notes"
              text="Keep all your study materials in one structured place."
            />
            <Feature
              icon={FaChartLine}
              title="Track Progress"
              text="Visual analytics to see how you are improving over time."
            />
            <Feature
              icon={FaUsers}
              title="Community"
              text="Connect with other students and share knowledge."
            />
          </SimpleGrid>
        </Box>
      </Stack>
    </Container>
  );
};

export default Landing;
