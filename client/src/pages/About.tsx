import {
  Box,
  Heading,
  Text,
  Container,
  Stack,
  Image,
  SimpleGrid,
  Card,
  Badge,
  Flex,
} from "@chakra-ui/react";

const TeamMember = ({
  name,
  role,
  image,
}: {
  name: string;
  role: string;
  image: string;
}) => (
  <Card.Root overflow="hidden">
    <Image src={image} alt={name} h="200px" w="full" objectFit="cover" />
    <Card.Body>
      <Stack gap={2} align="center">
        <Heading size="md">{name}</Heading>
        <Badge colorPalette="teal">{role}</Badge>
      </Stack>
    </Card.Body>
  </Card.Root>
);

const About = () => {
  return (
    <Container maxW="4xl" py={10}>
      <Stack gap={12}>
        <Box textAlign="center">
          <Heading size="3xl" mb={4}>
            About Us
          </Heading>
          <Text fontSize="lg" color="gray.500">
            We are a passionate team dedicated to revolutionizing the way people
            learn.
          </Text>
        </Box>

        <Flex direction={{ base: "column", md: "row" }} gap={8} align="center">
          <Box flex="1">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Team working"
              borderRadius="xl"
            />
          </Box>
          <Stack flex="1" gap={4}>
            <Heading size="xl">Our Mission</Heading>
            <Text color="gray.600" fontSize="lg">
              Our mission is to provide accessible, high-quality educational
              tools to students worldwide. We believe that everyone deserves the
              chance to reach their full potential through effective learning
              strategies.
            </Text>
            <Text color="gray.600" fontSize="lg">
              Founded in 2025, we have helped thousands of students improve
              their grades and study habits.
            </Text>
          </Stack>
        </Flex>

        <Box>
          <Heading size="xl" mb={8} textAlign="center">
            Meet the Team
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            <TeamMember
              name="Sarah Johnson"
              role="CEO & Founder"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            />
            <TeamMember
              name="Michael Chen"
              role="CTO"
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            />
            <TeamMember
              name="Emily Davis"
              role="Head of Design"
              image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            />
          </SimpleGrid>
        </Box>
      </Stack>
    </Container>
  );
};

export default About;
