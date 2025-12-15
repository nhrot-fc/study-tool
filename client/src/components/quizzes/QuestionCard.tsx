import {
  Card,
  VStack,
  Text,
  Box,
  Checkbox,
  RadioGroup,
  HStack,
} from "@chakra-ui/react";
import { type QuestionRead, type QuestionPublic } from "../../lib/types";
import { Markdown } from "../ui/Markdown";

interface QuestionCardProps {
  question: QuestionRead | QuestionPublic;
  index: number;
  selectedOptions?: string[];
  onAnswerChange?: (
    questionId: string,
    optionId: string,
    checked: boolean,
    isMultiple: boolean,
  ) => void;
  readOnly?: boolean;
  // Functions to determine status in readOnly mode
  isCorrectOption?: (optionId: string) => boolean;
  isUserSelected?: (optionId: string) => boolean;
}

export function QuestionCard({
  question,
  index,
  selectedOptions = [],
  onAnswerChange,
  readOnly = false,
  isCorrectOption,
  isUserSelected,
}: QuestionCardProps) {
  const isMultiple = question.correct_answer_count > 1;

  return (
    <Card.Root>
      <Card.Body>
        <VStack align="start" gap={4} width="full">
          <Text fontWeight="bold" fontSize="lg" color="gray.400">
            {index + 1}. {question.title}
            {isMultiple && (
              <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                (Select all {question.correct_answer_count} that apply)
              </Text>
            )}
          </Text>
          <Box width="full">
            <Markdown>{question.description}</Markdown>
          </Box>

          <VStack align="start" gap={3} width="full">
            {readOnly ? (
              // Read-only / Review Mode
              question.options.map((option) => {
                const correct = isCorrectOption?.(option.id) ?? false;
                const selected = isUserSelected?.(option.id) ?? false;

                let borderColor = "gray.200";
                let bg = "transparent";
                let darkBg = undefined;

                if (correct) {
                  borderColor = "green.500";
                  bg = "green.50";
                  darkBg = "green.900/20";
                } else if (selected && !correct) {
                  borderColor = "red.500";
                  bg = "red.50";
                  darkBg = "red.900/20";
                }

                return (
                  <Box
                    key={option.id}
                    width="full"
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderColor}
                    bg={bg}
                    _dark={{ bg: darkBg }}
                  >
                    <Markdown>{option.text}</Markdown>
                  </Box>
                );
              })
            ) : isMultiple ? (
              // Multiple Choice (Checkbox)
              question.options.map((option) => (
                <Checkbox.Root
                  key={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={(e) =>
                    onAnswerChange?.(question.id, option.id, !!e.checked, true)
                  }
                  width="full"
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                  cursor="pointer"
                  _checked={{
                    borderColor: "blue.500",
                    bg: "blue.50",
                    _dark: { bg: "blue.900/20" },
                  }}
                >
                  <Checkbox.HiddenInput />
                  <HStack width="full" gap={2} align="start">
                    <Checkbox.Control mt={1} />
                    <Box flex="1">
                      <Markdown>{option.text}</Markdown>
                    </Box>
                  </HStack>
                </Checkbox.Root>
              ))
            ) : (
              // Single Choice (Radio)
              <RadioGroup.Root
                value={selectedOptions[0] || ""}
                onValueChange={(e) => {
                  if (e.value) {
                    onAnswerChange?.(question.id, e.value, true, false);
                  }
                }}
                width="full"
              >
                <VStack gap={3} width="full">
                  {question.options.map((option) => (
                    <RadioGroup.Item
                      key={option.id}
                      value={option.id}
                      width="full"
                      p={2}
                      borderWidth="1px"
                      borderRadius="md"
                      cursor="pointer"
                      _checked={{
                        borderColor: "blue.500",
                        bg: "blue.50",
                        _dark: { bg: "blue.900/20" },
                      }}
                    >
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemControl mt={1} alignSelf="start" />
                      <RadioGroup.ItemText flex="1">
                        <Markdown>{option.text}</Markdown>
                      </RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                </VStack>
              </RadioGroup.Root>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
