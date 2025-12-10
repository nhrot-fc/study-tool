import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const Layout = () => {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Flex flex="1">
        <Box flex="1" p={8} bg="gray.50" _dark={{ bg: "gray.900" }}>
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;
