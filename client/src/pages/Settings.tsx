import {
  Box,
  Heading,
  Text,
  Container,
  Stack,
  Input,
  Button,
  Card,
  Separator,
} from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  return (
    <Container maxW="3xl" py={10}>
      <Heading size="2xl" mb={8}>
        Settings
      </Heading>

      <Stack gap={8}>
        <Card.Root>
          <Card.Header>
            <Heading size="md">Profile Information</Heading>
            <Text color="gray.500" fontSize="sm">
              Update your account details and public profile.
            </Text>
          </Card.Header>
          <Card.Body>
            <Stack gap={4}>
              <Stack gap={1}>
                <Text fontWeight="medium">Full Name</Text>
                <Input placeholder="John Doe" />
              </Stack>
              <Stack gap={1}>
                <Text fontWeight="medium">Email Address</Text>
                <Input placeholder="john@example.com" type="email" />
              </Stack>
              <Stack gap={1}>
                <Text fontWeight="medium">Bio</Text>
                <Input placeholder="Tell us a little about yourself" />
              </Stack>
            </Stack>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <Button colorPalette="teal">Save Changes</Button>
          </Card.Footer>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="md">Notifications</Heading>
            <Text color="gray.500" fontSize="sm">
              Manage how you receive notifications.
            </Text>
          </Card.Header>
          <Card.Body>
            <Stack gap={6}>
              <Stack direction="row" justify="space-between" align="center">
                <Box>
                  <Text fontWeight="medium">Email Notifications</Text>
                  <Text color="gray.500" fontSize="sm">
                    Receive emails about your account activity.
                  </Text>
                </Box>
                <Switch />
              </Stack>
              <Separator />
              <Stack direction="row" justify="space-between" align="center">
                <Box>
                  <Text fontWeight="medium">Push Notifications</Text>
                  <Text color="gray.500" fontSize="sm">
                    Receive push notifications on your device.
                  </Text>
                </Box>
                <Switch defaultChecked />
              </Stack>
              <Separator />
              <Stack direction="row" justify="space-between" align="center">
                <Box>
                  <Text fontWeight="medium">Marketing Emails</Text>
                  <Text color="gray.500" fontSize="sm">
                    Receive emails about new features and offers.
                  </Text>
                </Box>
                <Switch />
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="md" color="red.500">
              Danger Zone
            </Heading>
          </Card.Header>
          <Card.Body>
            <Stack direction="row" justify="space-between" align="center">
              <Box>
                <Text fontWeight="medium">Delete Account</Text>
                <Text color="gray.500" fontSize="sm">
                  Permanently delete your account and all of your content.
                </Text>
              </Box>
              <Button colorPalette="red" variant="outline">
                Delete Account
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  );
};

export default Settings;
