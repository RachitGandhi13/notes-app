// Ascend v2: the shared @repo/ui Button now carries the Ascend pill restyle
// directly (see ../button.tsx), so AscendButton is just an alias — kept so
// existing call sites (written against AscendButton) don't need to change.
export { Button as AscendButton, buttonVariants as ascendButtonVariants } from "../button";
export type { ButtonProps as AscendButtonProps } from "../button";
