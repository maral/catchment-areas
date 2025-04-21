"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getRootPathBySchoolType } from "@/entities/School";
import { cn } from "@/lib/utils";
import { SchoolType } from "@/types/basicTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

type FormValues = {
  validFrom: Date | undefined;
  validTo: Date | undefined;
  serialNumber: string;
  file: File | null;
};

const validationSchema = Yup.object({
  validFrom: Yup.date().nullable().required(texts.requiredField),
  validTo: Yup.date()
    .nullable()
    .when("validFrom", ([validFrom], schema) =>
      schema.test({
        test: (validTo: Date | null | undefined) => {
          return (
            !validTo ||
            !validFrom ||
            (!isNaN(validFrom.getTime()) &&
              !isNaN(validTo.getTime()) &&
              validTo > validFrom)
          );
        },
        message: texts.requiredValidToAfterValidFrom,
      })
    ),
  serialNumber: Yup.string().required(texts.requiredOrdinanceNumber),
  file: Yup.mixed().required(texts.requiredFile),
});

export default function UploadOrdinance({
  cityCode,
  schoolType,
}: {
  cityCode: string;
  schoolType: SchoolType;
}) {
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
      validFrom: undefined,
      validTo: undefined,
      serialNumber: "",
      file: null,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const data = new FormData();

    const rootPath = getRootPathBySchoolType(schoolType);

    data.set("file", values.file!);
    data.set("validFrom", values.validFrom!.toISOString());
    data.set("validTo", values.validTo ? values.validTo.toISOString() : "");
    data.set("serialNumber", values.serialNumber);
    data.set("cityCode", cityCode);
    data.set("schoolType", schoolType.toString());
    data.set("redirectRootUrl", rootPath);

    const res = await fetch("/api/ordinances/add-from-upload", {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        router.push(`${rootPath}/${cityCode}${routes.detail}`);
        return;
      }
    } else {
      console.error("File upload error");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-[280px]"
      >
        <FormField
          control={form.control}
          name="validFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.validFrom}</FormLabel>
              <DatePicker
                selected={field.value}
                onSelect={field.onChange}
                placeholder={texts.selectDate}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="validTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.validTo}</FormLabel>
              <DatePicker
                selected={field.value}
                onSelect={field.onChange}
                placeholder={texts.selectDate}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.ordinanceNumber}</FormLabel>
              <Input {...field} placeholder={texts.ordinanceNumberExample} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.ordinanceFile}</FormLabel>
              <Input
                onChange={(e) => field.onChange(e.target.files?.[0])}
                type="file"
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

function DatePicker({
  selected,
  onSelect,
  placeholder,
}: {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-[280px] justify-start text-left font-normal",
          !selected && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selected ? format(selected, "PPP", { locale: cs }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          locale={cs}
          selected={selected}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
