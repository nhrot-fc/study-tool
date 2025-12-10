import { Button, Input, Stack, Text } from "@chakra-ui/react";
import { Popover } from "@/components/ui/popover";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";

export const LoginPopover = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      setIsOpen(false);
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </Popover.Trigger>
      <Popover.Content width="300px">
        <Popover.Arrow />
        <Popover.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Text fontWeight="bold" fontSize="lg">
                Sign in
              </Text>
              {error && (
                <Text color="red.500" fontSize="sm">
                  {error}
                </Text>
              )}
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
                  placeholder="Enter your password"
                />
              </Stack>
              <Button type="submit" colorPalette="teal" width="full">
                Sign in
              </Button>
            </Stack>
          </form>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
};
