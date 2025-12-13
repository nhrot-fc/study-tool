import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Input,
  HStack,
  VStack,
  Text,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { ColorModeButton } from "./ui/color-mode";
import { useAuth } from "../hooks/use-auth";
import { LuSearch, LuUser, LuMenu, LuX } from "react-icons/lu";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { LoginPopover } from "./LoginPopover";
import { RegisterPopover } from "./RegisterPopover";
import { apiClient } from "../lib/api";
import { type User } from "../lib/types";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  };

  return (
    <Box
      as="header"
      bg={{ base: "white", _dark: "gray.900" }}
      color={{ base: "gray.900", _dark: "white" }}
      py={3}
      px={6}
      borderBottomWidth="1px"
      borderColor={{ base: "gray.200", _dark: "gray.800" }}
    >
      <Flex alignItems="center" gap={4}>
        <RouterLink to="/">
          <Heading size="md" fontWeight="bold">
            Study Tool
          </Heading>
        </RouterLink>

        <Box
          display={{ base: "none", md: "block" }}
          w="300px"
          position="relative"
          ref={searchRef}
        >
          <HStack
            bg={{ base: "gray.100", _dark: "gray.800" }}
            borderRadius="md"
            px={3}
            py={1}
            border="1px solid"
            borderColor={{ base: "gray.200", _dark: "gray.700" }}
          >
            <LuSearch color="gray" />
            <Input
              placeholder="Search users..."
              variant="subtle"
              color="inherit"
              h="24px"
              fontSize="sm"
              css={{ "--input-placeholder-color": "colors.gray.500" }}
              border="none"
              _focus={{ outline: "none" }}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {loading && <Spinner size="xs" color="gray.500" />}
          </HStack>

          {showResults && query.length >= 3 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              bg={{ base: "white", _dark: "gray.800" }}
              borderRadius="md"
              boxShadow="lg"
              borderWidth="1px"
              borderColor={{ base: "gray.200", _dark: "gray.700" }}
              zIndex={1000}
              maxH="300px"
              overflowY="auto"
            >
              {results.length === 0 && !loading ? (
                <Box p={3} textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    No users found
                  </Text>
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
                      <HStack>
                        <Box
                          p={1}
                          bg="gray.100"
                          _dark={{ bg: "gray.700" }}
                          borderRadius="full"
                        >
                          <LuUser />
                        </Box>
                        <VStack align="start" gap={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {result.username}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
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

        <HStack gap={1} ml={4} display={{ base: "none", md: "flex" }}>
          <RouterLink to="/about">
            <Button variant="ghost" size="sm" as="span">
              About
            </Button>
          </RouterLink>
          {user && (
            <RouterLink to="/plans/new">
              <Button variant="ghost" size="sm" as="span">
                Create
              </Button>
            </RouterLink>
          )}
        </HStack>

        <Spacer />

        <HStack gap={3}>
          {!user ? (
            <>
              <LoginPopover />
              <RegisterPopover />
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Sign out
            </Button>
          )}
          <ColorModeButton />
          <IconButton
            display={{ base: "flex", md: "none" }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            size="sm"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <LuX /> : <LuMenu />}
          </IconButton>
        </HStack>
      </Flex>

      {isMobileMenuOpen && (
        <Box pb={4} display={{ md: "none" }} mt={4}>
          <Box position="relative" mb={4}>
            <HStack
              bg={{ base: "gray.100", _dark: "gray.800" }}
              borderRadius="md"
              px={3}
              py={2}
              border="1px solid"
              borderColor={{ base: "gray.200", _dark: "gray.700" }}
            >
              <LuSearch color="gray" />
              <Input
                placeholder="Search users..."
                variant="subtle"
                color="inherit"
                h="24px"
                fontSize="sm"
                css={{ "--input-placeholder-color": "colors.gray.500" }}
                border="none"
                _focus={{ outline: "none" }}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              {loading && <Spinner size="xs" color="gray.500" />}
            </HStack>
            {showResults && query.length >= 3 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                mt={2}
                bg={{ base: "white", _dark: "gray.800" }}
                borderRadius="md"
                boxShadow="lg"
                borderWidth="1px"
                borderColor={{ base: "gray.200", _dark: "gray.700" }}
                zIndex={1000}
                maxH="300px"
                overflowY="auto"
              >
                {results.length === 0 && !loading ? (
                  <Box p={3} textAlign="center">
                    <Text fontSize="sm" color="gray.500">
                      No users found
                    </Text>
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
                        <HStack>
                          <Box
                            p={1}
                            bg="gray.100"
                            _dark={{ bg: "gray.700" }}
                            borderRadius="full"
                          >
                            <LuUser />
                          </Box>
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {result.username}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
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

          <VStack align="stretch" gap={2}>
            <RouterLink to="/about" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" justifyContent="start" w="full">
                About
              </Button>
            </RouterLink>
            {user && (
              <RouterLink
                to="/plans/new"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" justifyContent="start" w="full">
                  Create Plan
                </Button>
              </RouterLink>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default Header;
