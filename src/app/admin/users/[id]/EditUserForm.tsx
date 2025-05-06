"use client";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { routes } from "@/utils/shared/constants";
import { Role, roles } from "@/utils/shared/permissions";
import { texts } from "@/utils/shared/texts";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

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
  const form = useForm<FormValues>({
    resolver: async (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      try {
        await validationSchema.validate(values, { abortEarly: false });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          err.inner.forEach((error) => {
            if (error.path) {
              errors[error.path as keyof FormValues] = error.message;
            }
          });
        }
      }
      return { values, errors };
    },
    defaultValues: {
      name: user.name,
      futureEmail: user.futureEmail,
      role: user.role,
    },
  });

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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-4 items-stretch"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.fullName}</FormLabel>
              <Input {...field} placeholder={texts.fillOutFullName} />
            </FormItem>
          )}
        />

        {user.futureEmail.length > 0 && (
          <FormField
            control={form.control}
            name="futureEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{texts.email}</FormLabel>
                <Input {...field} placeholder={texts.fillOutEmail} />
              </FormItem>
            )}
          />
        )}
        {user.email.length > 0 && (
          <FormItem>
            <FormLabel>{texts.email}</FormLabel>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.role}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={texts.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role, index) => (
                    <SelectItem key={index} value={role.role}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <Button
          className="w-full"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {texts.save}
        </Button>
      </form>
    </Form>
  );
}
