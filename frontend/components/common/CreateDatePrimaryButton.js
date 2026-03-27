import React from "react";
import styled from "styled-components";

const CreateDatePrimaryButton = ({
  children = "Create New Date",
  className,
  style,
  ...props
}) => {
  return (
    <Button
      type="button"
      className={className}
      style={style}
      aria-label={typeof children === "string" ? children : "Create New Date"}
      {...props}
    >
      <ButtonLabel>{children}</ButtonLabel>
    </Button>
  );
};

export default CreateDatePrimaryButton;

const Button = styled.button`
  width: min(100%, 300px) !important;
  max-width: 300px !important;
  height: 48px !important;
  min-height: 48px !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 8px !important;
  background: url("/images/primarycta.svg") center / 100% 100% no-repeat !important;
  background-color: transparent !important;
  box-shadow: none !important;
  color: transparent !important;
  display: block !important;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 0 !important;
  overflow: hidden;
  position: relative;
  text-indent: -9999px;

  &:focus,
  &:active,
  &:focus-visible {
    outline: none;
    box-shadow: none !important;
  }
`;

const ButtonLabel = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
