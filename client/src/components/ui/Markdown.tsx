import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Box, type BoxProps } from "@chakra-ui/react";
import "highlight.js/styles/github-dark.css";

interface MarkdownProps extends BoxProps {
  children: string;
}

export function Markdown({ children, ...props }: MarkdownProps) {
  return (
    <Box
      {...props}
      css={{
        "& p": { marginBottom: "0.5rem" },
        "& ul, & ol": { marginLeft: "1.5rem", marginBottom: "0.5rem" },
        "& pre": {
          borderRadius: "md",
          overflowX: "auto",
          marginBottom: "0.5rem",
          padding: "1rem",
          bg: "gray.900",
        },
        "& code": {
          fontFamily: "monospace",
          fontSize: "0.9em",
        },
        "& :not(pre) > code": {
          bg: "gray.100",
          _dark: { bg: "gray.800" },
          px: 1,
          py: 0.5,
          borderRadius: "sm",
        },
      }}
    >
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </Box>
  );
}
