import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Input,
  HStack,
} from "@chakra-ui/react";
import { ColorModeButton } from "./ui/color-mode";
import { useAuth } from "../hooks/use-auth";
import { LuSearch } from "react-icons/lu";
import { Link as RouterLink } from "react-router-dom";
import { LoginPopover } from "./LoginPopover";
import { RegisterPopover } from "./RegisterPopover";

const Header = () => {
  const { user, logout } = useAuth();

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

        <Box display={{ base: "none", md: "block" }} w="300px">
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
              placeholder="Search..."
              variant="subtle"
              color="inherit"
              h="24px"
              fontSize="sm"
              css={{ "--input-placeholder-color": "colors.gray.500" }}
              border="none"
              _focus={{ outline: "none" }}
            />
          </HStack>
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
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
