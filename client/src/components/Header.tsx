import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Input,
  HStack,
  VStack,
  Text,
  Spinner,
  IconButton,
  Container,
  Separator,
  Avatar,
  Icon,
} from "@chakra-ui/react";
import { ColorModeButton } from "./ui/color-mode";
import { useAuth } from "../hooks/use-auth";
import {
  LuSearch,
  LuMenu,
  LuX,
  LuBrainCircuit,
  LuLogOut,
  LuSettings,
  LuBookOpen,
  LuUser,
} from "react-icons/lu";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { LoginPopover } from "./LoginPopover";
import { RegisterPopover } from "./RegisterPopover";
import { Popover } from "./ui/popover";
import { apiClient } from "../lib/api";
import { type User } from "../lib/types";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const search = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const users = await apiClient.searchUsers(query);
        setResults(users);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
    setShowResults(false);
    setQuery("");
    setIsMobileMenuOpen(false);
  };

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      bg="bg/80"
      backdropFilter="blur(12px)"
      borderBottomWidth="1px"
      borderColor="border.subtle"
    >
      <Container maxW="container.xl">
        <Flex alignItems="center" py={3} gap={4}>
          {/* 1. BRANDING */}
          <RouterLink to="/">
            <HStack gap={2} _hover={{ opacity: 0.8 }} transition="opacity 0.2s">
              <Icon as={LuBrainCircuit} size="lg" color="blue.500" />
              <Heading size="md" fontWeight="bold" letterSpacing="tight">
                Study Tool
              </Heading>
            </HStack>
          </RouterLink>

          {/* 2. SEARCH BAR (Desktop) */}
          <Box
            display={{ base: "none", md: "block" }}
            flex="1"
            maxW="400px"
            mx={8}
            position="relative"
            ref={searchRef}
          >
            <HStack
              bg="bg.muted"
              borderRadius="full"
              px={4}
              py={1.5}
              borderWidth="1px"
              borderColor="transparent"
              transition="all 0.2s"
              _focusWithin={{
                bg: "bg.panel",
                borderColor: "blue.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
              }}
            >
              <Icon as={LuSearch} color="fg.muted" />
              <Input
                placeholder="Find users..."
                variant="subtle"
                bg="transparent"
                _focus={{ bg: "transparent" }}
                h="auto"
                p={0}
                fontSize="sm"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              {loading && <Spinner size="xs" color="fg.muted" />}
            </HStack>

            {/* Search Results Dropdown */}
            {showResults && query.length >= 3 && (
              <Box
                position="absolute"
                top="calc(100% + 8px)"
                left={0}
                right={0}
                bg="bg.panel"
                borderRadius="lg"
                boxShadow="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                maxH="300px"
                overflowY="auto"
                zIndex="popover"
              >
                {results.length === 0 && !loading ? (
                  <Box p={4} textAlign="center" color="fg.muted">
                    <Text fontSize="sm">No users found</Text>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={0}>
                    <Box px={3} py={2} bg="bg.muted/50">
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Users
                      </Text>
                    </Box>
                    {results.map((result) => (
                      <Button
                        key={result.id}
                        variant="ghost"
                        justifyContent="start"
                        h="auto"
                        py={3}
                        px={4}
                        borderRadius={0}
                        onClick={() => handleUserClick(result.id)}
                        _hover={{ bg: "bg.muted" }}
                      >
                        <HStack gap={3}>
                          <Avatar.Root size="xs">
                            <Avatar.Fallback name={result.username} />
                          </Avatar.Root>
                          <VStack align="start" gap={0} lineHeight="1.2">
                            <Text fontSize="sm" fontWeight="medium">
                              {result.username}
                            </Text>
                            <Text fontSize="xs" color="fg.muted">
                              {result.email}
                            </Text>
                          </VStack>
                        </HStack>
                      </Button>
                    ))}
                  </VStack>
                )}
              </Box>
            )}
          </Box>

          {/* 3. DESKTOP NAVIGATION & ACTIONS */}
          <HStack gap={1} display={{ base: "none", md: "flex" }} ml="auto">
            <RouterLink to="/about">
              <Button variant="ghost" size="sm" color="fg.muted">
                About
              </Button>
            </RouterLink>

            <ColorModeButton />

            {!user ? (
              <HStack gap={2} ml={2}>
                <LoginPopover />
                <RegisterPopover />
              </HStack>
            ) : (
              <UserMenu user={user} logout={logout} />
            )}
          </HStack>

          {/* 4. MOBILE TOGGLE */}
          <IconButton
            display={{ base: "flex", md: "none" }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            size="sm"
            ml="auto"
          >
            {isMobileMenuOpen ? <LuX /> : <LuMenu />}
          </IconButton>
        </Flex>

        {/* 5. MOBILE MENU */}
        {isMobileMenuOpen && (
          <Box pb={4} display={{ md: "none" }}>
            <VStack align="stretch" gap={4}>
              {/* Mobile Search */}
              <Box>
                <HStack bg="bg.muted" borderRadius="md" px={3} py={2}>
                  <Icon as={LuSearch} color="fg.muted" />
                  <Input
                    placeholder="Search users..."
                    variant="subtle"
                    bg="transparent"
                    _focus={{ bg: "transparent" }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {loading && <Spinner size="xs" color="fg.muted" />}
                </HStack>

                {query.length >= 3 && (
                  <Box
                    mt={2}
                    bg="bg.panel"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    maxH="200px"
                    overflowY="auto"
                  >
                    {results.length === 0 && !loading ? (
                      <Box p={3} textAlign="center" color="fg.muted">
                        <Text fontSize="sm">No users found</Text>
                      </Box>
                    ) : (
                      <VStack align="stretch" gap={0}>
                        {results.map((result) => (
                          <Button
                            key={result.id}
                            variant="ghost"
                            justifyContent="start"
                            h="auto"
                            py={2}
                            px={3}
                            borderRadius={0}
                            onClick={() => handleUserClick(result.id)}
                          >
                            <HStack gap={2}>
                              <Avatar.Root size="xs">
                                <Avatar.Fallback name={result.username} />
                              </Avatar.Root>
                              <Text fontSize="sm" truncate>
                                {result.username}
                              </Text>
                              <Text fontSize="xs" color="fg.muted" truncate>
                                {result.email}
                              </Text>
                            </HStack>
                          </Button>
                        ))}
                      </VStack>
                    )}
                  </Box>
                )}
              </Box>

              <VStack align="stretch" gap={1}>
                <RouterLink to="/">
                  <Button variant="ghost" justifyContent="start" w="full">
                    Home
                  </Button>
                </RouterLink>
                <RouterLink to="/about">
                  <Button variant="ghost" justifyContent="start" w="full">
                    About
                  </Button>
                </RouterLink>
                {user && (
                  <RouterLink to="/plans/new">
                    <Button
                      variant="ghost"
                      justifyContent="start"
                      colorPalette="blue"
                      w="full"
                    >
                      <LuBookOpen /> Create New Plan
                    </Button>
                  </RouterLink>
                )}
              </VStack>

              <Separator />

              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="medium">
                  Theme
                </Text>
                <ColorModeButton />
              </HStack>

              {!user ? (
                <VStack align="stretch" gap={2}>
                  <LoginPopover />
                  <RegisterPopover />
                </VStack>
              ) : (
                <Button
                  variant="surface"
                  colorPalette="red"
                  onClick={() => logout()}
                  justifyContent="start"
                >
                  <LuLogOut /> Sign Out
                </Button>
              )}
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  );
};

// --- SUBCOMPONENT: User Menu Dropdown ---
function UserMenu({ user, logout }: { user: any; logout: () => void }) {
  return (
    <Popover.Root positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          borderRadius="full"
          p={0}
          w="32px"
          h="32px"
          ml={2}
        >
          <Avatar.Root size="xs" colorPalette="blue">
            <Avatar.Fallback name={user.username} />
          </Avatar.Root>
        </Button>
      </Popover.Trigger>
      <Popover.Content minW="200px" width="auto">
        <Popover.Body p={2}>
          <VStack align="stretch" gap={1}>
            <Box px={2} py={1.5} mb={1}>
              <Text fontSize="sm" fontWeight="semibold" truncate maxW="180px">
                {user.username}
              </Text>
              <Text fontSize="xs" color="fg.muted" truncate maxW="180px">
                {user.email}
              </Text>
            </Box>

            <Separator />

            <RouterLink to={`/users/${user.id}`}>
              <Button variant="ghost" size="sm" justifyContent="start" w="full">
                <LuUser /> My Profile
              </Button>
            </RouterLink>

            <RouterLink to="/settings">
              <Button variant="ghost" size="sm" justifyContent="start" w="full">
                <LuSettings /> Settings
              </Button>
            </RouterLink>

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              colorPalette="red"
              justifyContent="start"
              onClick={logout}
            >
              <LuLogOut /> Sign out
            </Button>
          </VStack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}

export default Header;
