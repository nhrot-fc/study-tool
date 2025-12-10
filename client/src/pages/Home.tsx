import { Box, Heading, Text, Stack, Container } from "@chakra-ui/react";
import { useAuth } from "../hooks/use-auth";

const Home = () => {
  const { user } = useAuth();

  return (
    <Container maxW="6xl">
      <Stack gap={12}>
        <Box textAlign="center" py={10} px={6}>
          <Heading
            as="h1"
            size="4xl"
            mt={10}
            mb={6}
            fontWeight="bold"
            letterSpacing="tight"
          >
            Welcome{" "}
            <Text as="span" color="teal.500">
              {user?.username}
            </Text>
          </Heading>
        </Box>
      </Stack>
    </Container>
  );
};

export default Home;
