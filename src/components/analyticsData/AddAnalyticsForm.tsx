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
import { texts } from "@/utils/shared/texts";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

import { AnalyticsDataType } from "@/types/basicTypes";

type FormValues = {
  dataType: string;
  file: File | null;
};

const dataTypes: Array<{ value: AnalyticsDataType; label: string }> = [
  {
    value: AnalyticsDataType.StudentsTotal,
    label: texts.analyticsTotalStudents,
  },
  { value: AnalyticsDataType.StudentsUa, label: texts.analyticsUaStudents },
  {
    value: AnalyticsDataType.ConsultationsNpi,
    label: texts.analyticsConsultationsNpi,
  },
  {
    value: AnalyticsDataType.SocialExclusionIndex,
    label: texts.isv,
  },
];

const validationSchema = Yup.object({
  dataType: Yup.string().required(texts.requiredField),
  file: Yup.mixed().required(texts.requiredField),
});

export default function AddAnalyticsForm({}: {}) {
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
      dataType: "",
      file: null,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const data = new FormData();

    data.set("file", values.file!);
    data.set("dataType", values.dataType);

    const res = await fetch("/api/analytics-data/add-from-upload", {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        router.push(`${routes.analytics}`);
      } else {
        console.error(result.message);
      }
    } else {
      console.error("File upload error");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="dataType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.analyticsDataType}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={texts.analyticsSelect} />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((dataType, index) => (
                    <SelectItem key={index} value={String(dataType.value)}>
                      {dataType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.analyticsFile}</FormLabel>
              <Input
                onChange={(e) => field.onChange(e.target.files?.[0])}
                type="file"
                accept=".xlsx"
              />
            </FormItem>
          )}
        />
        <Button
          className="w-full"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {texts.add}
        </Button>
      </form>
    </Form>
  );
}
