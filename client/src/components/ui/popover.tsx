import { Popover as ChakraPopover, Portal } from "@chakra-ui/react";
import * as React from "react";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  ChakraPopover.ContentProps & {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement | null>;
  }
>(function PopoverContent(props, ref) {
  const { portalled = true, portalRef, ...rest } = props;
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraPopover.Positioner>
        <ChakraPopover.Content ref={ref} {...rest} />
      </ChakraPopover.Positioner>
    </Portal>
  );
});

const PopoverArrow = React.forwardRef<HTMLDivElement, ChakraPopover.ArrowProps>(
  function PopoverArrow(props, ref) {
    return (
      <ChakraPopover.Arrow ref={ref} {...props}>
        <ChakraPopover.ArrowTip />
      </ChakraPopover.Arrow>
    );
  },
);

export const Popover = {
  ...ChakraPopover,
  Content: PopoverContent,
  Arrow: PopoverArrow,
};
