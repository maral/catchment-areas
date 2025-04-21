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
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { Role, roles } from "@/utils/shared/permissions";
import { texts } from "@/utils/shared/texts";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
      name: "",
      email: "",
      role: Role.User,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const data = new FormData();

    data.set("name", values.name);
    data.set("email", values.email);
    data.set("role", values.role);

    const res = await fetch(`/api/user/add`, {
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
      console.error("Cannot add user.");
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.email}</FormLabel>
              <Input {...field} placeholder={texts.fillOutEmail} />
              <p className="mt-2 italic text-sm text-gray-600">
                {texts.microsoftAccountRequired}
              </p>
            </FormItem>
          )}
        />

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
          color={Colors.Primary}
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {texts.save}
        </Button>
      </form>
    </Form>
  );
}
