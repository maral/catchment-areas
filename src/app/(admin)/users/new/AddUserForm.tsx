"use client";

import {
  InputSubtitle,
  StyledErrorMessage,
  StyledForm,
} from "@/components/common/Forms";
import { Role, roles } from "@/utils/shared/permissions";
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Button, TextInput } from "@tremor/react";
import { Field, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

type FormValues = {
  name: string;
  email: string;
  role: Role;
};

const validationSchema = Yup.object({
  name: Yup.string().required(texts.requiredField),
  email: Yup.string().required(texts.requiredField).email(texts.fillValidEmail),
  role: Yup.string().required(texts.requiredField),
});

export default function AddUserForm() {
  const router = useRouter();
  const onSubmit = async (
    values: FormValues,
    { setErrors }: FormikHelpers<FormValues>
  ) => {
    const data = new FormData();

    data.set("name", values.name);
    data.set("email", values.email);
    data.set("role", values.role);

    const res = await fetch(`/api/user/add`, {
      method: "POST",
      body: data,
    });

    const result = await res.json();
    if (res.ok) {
      if (result.success) {
        router.push(routes.users);
        router.refresh();
      }
    } else {
      setErrors(result.error);
    }
  };

  return (
    <Formik
      initialValues={{
        name: "",
        email: "",
        role: Role.User,
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => {
        return (
          <StyledForm>
            <div>
              <InputSubtitle>{texts.fullName}</InputSubtitle>
              <Field
                placeholder={texts.fillOutFullName}
                name="name"
                as={TextInput}
              />
              <StyledErrorMessage name="name" />
            </div>

            <div>
              <InputSubtitle>{texts.email}</InputSubtitle>
              <Field
                placeholder={texts.fillOutEmail}
                name="email"
                as={TextInput}
              />
              <StyledErrorMessage name="email" />
              <p className="mt-2 italic text-sm text-gray-600">
                {texts.microsoftAccountRequired}
              </p>
            </div>

            <div>
              <InputSubtitle>{texts.role}</InputSubtitle>
              <Field
                className="p-2 px-3 w-full shadow-xs text-sm text-gray-500 border border-gray-200 rounded-md outline-hidden focus:ring-2"
                name="role"
                as="select"
              >
                {roles.map((role, index) => (
                  <option key={index} value={role.role} className="my-1">
                    {role.label}
                  </option>
                ))}
              </Field>
              <StyledErrorMessage name="role" />
            </div>

            <Button
              className="w-full"
              color={Colors.Primary}
              disabled={isSubmitting}
              type="submit"
            >
              {texts.save}
            </Button>
          </StyledForm>
        );
      }}
    </Formik>
  );
}
