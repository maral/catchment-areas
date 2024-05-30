"use client";

import { Role, roles } from "@/utils/shared/permissions";
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Button, Subtitle, TextInput } from "@tremor/react";
import { Field, Formik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { InputSubtitle, StyledForm } from "@/components/common/Forms";

type UserInfo = {
  id: string;
  name: string;
  email: string;
  futureEmail: string;
  role: Role;
};

type FormValues = {
  name: string;
  futureEmail: string;
  role: Role;
};

const validationSchema = Yup.object({
  name: Yup.string().required(texts.requiredField),
  futureEmail: Yup.string(),
  role: Yup.string().required(texts.requiredField),
});

export default function EditUserForm({ user }: { user: UserInfo }) {
  const router = useRouter();
  const onSubmit = async (values: FormValues) => {
    const data = new FormData();

    data.set("name", values.name);
    data.set("futureEmail", values.futureEmail);
    data.set("role", values.role);

    const res = await fetch(`/api/user/${user.id}/edit`, {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        router.push(routes.users);
        router.refresh();
        return;
      }
    } else {
      console.error("Cannot edit user.");
    }
  };

  return (
    <Formik
      initialValues={{
        name: user.name,
        futureEmail: user.futureEmail,
        role: user.role,
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
            </div>

            <div>
              <InputSubtitle>{texts.email}</InputSubtitle>
              {user.futureEmail.length > 0 && (
                <Field
                  placeholder={texts.fillOutEmail}
                  name="futureEmail"
                  as={TextInput}
                />
              )}
              {user.email.length > 0 && (
                <p className="mt-3 text-gray-600 text-sm">{user.email}</p>
              )}
            </div>

            <div>
              <InputSubtitle>{texts.role}</InputSubtitle>
              <Field
                className="p-2 px-3 w-full shadow-sm text-sm text-gray-500 border border-gray-300 rounded-md outline-none focus:ring-2"
                name="role"
                as="select"
              >
                {roles.map((role, index) => (
                  <option key={index} value={role.role} className="my-1">
                    {role.label}
                  </option>
                ))}
              </Field>
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
