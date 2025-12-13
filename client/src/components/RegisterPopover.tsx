import { Button, Input, Stack, Text } from "@chakra-ui/react";
import { Popover } from "@/components/ui/popover";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";

export const RegisterPopover = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, username, password);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm">
          Sign up
        </Button>
      </Popover.Trigger>
      <Popover.Content width="320px">
        <Popover.Arrow />
        <Popover.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Text fontWeight="bold" fontSize="lg">
                Create account
              </Text>
              {error && (
                <Text color="red.500" fontSize="sm">
                  {error}
                </Text>
              )}
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Username
                </Text>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </Stack>
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Email
                </Text>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </Stack>
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Password
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                />
              </Stack>
              <Button type="submit" colorPalette="teal" width="full">
                Sign up
              </Button>
            </Stack>
          </form>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
};
