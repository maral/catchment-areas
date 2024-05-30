import { Subtitle } from "@tremor/react";
import { ErrorMessage, Form } from "formik";
import { ComponentProps } from "react";

export function StyledForm({ children }: { children: React.ReactNode }) {
  return <Form className="flex flex-col gap-4">{children}</Form>;
}

export function InputSubtitle({ children }: { children: React.ReactNode }) {
  return <Subtitle className="mb-2">{children}</Subtitle>;
}

export function StyledErrorMessage(props: ComponentProps<typeof ErrorMessage>) {
  return (
    <ErrorWrapper>
      <ErrorMessage {...props} component="div" />
    </ErrorWrapper>
  );
}

export function ErrorWrapper({ children }: { children: React.ReactNode }) {
  return <div className="text-red-500 text-sm mt-2">{children}</div>;
}
