import { useEffect, useState, useMemo } from "react";
import { HStack, Text, Icon, Badge } from "@chakra-ui/react";
import { LuTimer, LuCircleAlert } from "react-icons/lu";

interface QuizTimerProps {
  startedAt: string;
  durationMinutes: number;
  onExpire?: () => void;
}

export function QuizTimer({ startedAt, durationMinutes, onExpire }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60 * 1000);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startedAt) return;

    const endTime = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        clearInterval(interval); // Detenemos el intervalo inmediatamente
        if (onExpire) onExpire();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onExpire]);

  // Lógica de presentación
  const { colorPalette, icon } = useMemo(() => {
    if (isExpired) return { colorPalette: "red", icon: LuCircleAlert };
    if (timeLeft < 60 * 1000) return { colorPalette: "orange", icon: LuTimer }; // < 1 min
    return { colorPalette: "gray", icon: LuTimer };
  }, [timeLeft, isExpired]);

  // Formato MM:SS
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  if (!startedAt) return null;

  return (
    <Badge 
      variant="surface" 
      colorPalette={colorPalette} 
      px={3} 
      py={1} 
      borderRadius="full"
      fontSize="md"
    >
      <HStack gap={2}>
        <Icon as={icon} />
        <Text 
          fontWeight="semibold" 
          fontVariantNumeric="tabular-nums" 
        >
          {formattedTime}
        </Text>
      </HStack>
    </Badge>
  );
}