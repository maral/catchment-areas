"use client";

import { OrdinanceController } from "@/controllers/OrdinanceController";
import { getRootPathBySchoolType } from "@/entities/School";
import { Colors } from "@/styles/Themes";
import { SchoolType } from "@/types/basicTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Button, DatePicker, TextInput } from "@tremor/react";
import { cs } from "date-fns/locale";
import { Field, FieldProps, Formik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import {
  ErrorWrapper,
  InputSubtitle,
  StyledErrorMessage,
  StyledForm,
} from "../common/Forms";
import Header from "../common/Header";

interface FormValues {
  validFrom: Date | undefined;
  validTo: Date | undefined;
  serialNumber: string;
  file: File | null;
}

export default function UploadOrdinance({
  cityCode,
  schoolType,
}: {
  cityCode: string;
  schoolType: SchoolType;
}) {
  const router = useRouter();

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
        OrdinanceController.determineActiveOrdinanceByCityCode(
          Number(cityCode),
          schoolType
        );
        router.push(`${rootPath}/${cityCode}${routes.detail}`);
        return;
      }
    } else {
      console.error("File upload error");
    }
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

  return (
    <Formik
      initialValues={{
        validFrom: undefined,
        validTo: undefined,
        serialNumber: "",
        file: null,
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, setFieldValue }) => (
        <StyledForm>
          <Header className="shrink">{texts.addOrdinanceManually}</Header>

          <div>
            <InputSubtitle>{texts.validFrom}</InputSubtitle>
            <Field name="validFrom">
              {(props: FieldProps) => <DatePickerWrapper {...props} />}
            </Field>
          </div>

          <div>
            <InputSubtitle>{texts.validTo}</InputSubtitle>
            <Field name="validTo">
              {(props: FieldProps) => <DatePickerWrapper {...props} />}
            </Field>
          </div>

          <div>
            <InputSubtitle>{texts.ordinanceNumber}</InputSubtitle>
            <Field
              type="text"
              name="serialNumber"
              placeholder={texts.ordinanceNumber}
              as={TextInput}
            />
            <StyledErrorMessage name="serialNumber" />
          </div>

          <div>
            <InputSubtitle>{texts.ordinanceFile}</InputSubtitle>
            <input
              className="relative m-0 block min-w-0 flex-auto rounded
                border border-solid border-neutral-300 bg-clip-padding px-3
                py-[0.32rem] text-base font-normal text-neutral-700 transition
                duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem]
                file:overflow-hidden file:rounded-none file:border-0
                file:border-solid file:border-inherit file:bg-neutral-100
                file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition
                file:duration-150 file:ease-in-out file:[border-inline-end-width:1px]
                file:[margin-inline-end:0.75rem] hover:file:bg-neutral-200
                focus:border-primary focus:text-neutral-700 focus:shadow-te-primary focus:outline-none"
              type="file"
              id="file"
              onChange={(event) => {
                setFieldValue("file", event.currentTarget.files?.[0]);
              }}
            />
            <StyledErrorMessage name="file" />
          </div>

          <Button
            disabled={isSubmitting}
            type="submit"
            className="w-64"
            color={Colors.Primary}
          >
            {texts.add}
          </Button>
        </StyledForm>
      )}
    </Formik>
  );
}

function DatePickerWrapper({
  field: { name },
  form: { setFieldValue, setFieldTouched },
  meta: { touched, error },
}: FieldProps<Date | undefined, FormValues>) {
  return (
    <div>
      <DatePicker
        locale={cs}
        placeholder={texts.selectDate}
        onValueChange={(value) => {
          setFieldTouched(name, true);
          setFieldValue(name, value ?? null);
        }}
      />
      {touched && error ? <ErrorWrapper>{error}</ErrorWrapper> : null}
    </div>
  );
}
