import { ErrorMessage, Form } from "formik";
import { ComponentProps } from "react";

export function StyledForm({ children }: { children: React.ReactNode }) {
  return <Form className="flex flex-col gap-4">{children}</Form>;
}

export function InputSubtitle({ children }: { children: React.ReactNode }) {
  return <span className="mb-2">{children}</span>;
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
