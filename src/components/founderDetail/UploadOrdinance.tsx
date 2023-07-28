"use client";

import { texts } from "@/utils/shared/texts";
import { Button, DatePicker, Subtitle, TextInput } from "@tremor/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { cs } from "date-fns/locale";
import * as Yup from "yup";
import Header from "../common/Header";
import { Colors } from "@/styles/Themes";

interface FormValues {
  name: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  file: File | null;
}

export default function UploadOrdinance({ founderId }: { founderId: string }) {
  const onSubmit = async (values: FormValues) => {
    const data = new FormData();
    if (values.file) {
      data.append("file", values.file);
    }
    data.append("name", values.name);
    data.append("validFrom", values.validFrom);
    data.append("validTo", values.validTo);
    data.append("serialNumber", values.serialNumber);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      console.log("File uploaded successfully");
    } else {
      console.error("File upload error");
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    validFrom: Yup.date().required("Required"),
    validTo: Yup.date()
      .required("Required")
      .when(
        "validFrom",
        (validFrom, schema) =>
          validFrom &&
          schema.min(validFrom, "validTo must be later than validFrom")
      ),
    serialNumber: Yup.string().required("Required"),
    file: Yup.mixed().required("A file is required"),
  });

  return (
    <Formik
      initialValues={{
        name: "",
        validFrom: "",
        validTo: "",
        serialNumber: "",
        file: null,
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, setFieldValue }) => (
        <Form className="flex flex-col gap-8">
          <Header className="shrink">{texts.addOrdinanceManually}</Header>
          <div>
            <InputSubtitle>{texts.ordinanceName}</InputSubtitle>
            <Field
              type="text"
              name="name"
              placeholder={texts.fillOutName}
              component={TextInput}
            />
            <ErrorMessage name="name" component="div" />
          </div>

          <div>
            <InputSubtitle>{texts.validFrom}</InputSubtitle>
            <Field
              type="date"
              name="validFrom"
              placeholder={texts.selectDate}
              component={DatePicker}
            />
            <ErrorMessage name="validFrom" component="div" />
          </div>

          <div>
            <InputSubtitle>{texts.validTo}</InputSubtitle>
            <Field
              type="date"
              name="validTo"
              locale={cs}
              placeholder={texts.selectDate}
              component={DatePicker}
            />
            <ErrorMessage name="validTo" component="div" />
          </div>

          <div>
            <InputSubtitle>{texts.ordinanceNumber}</InputSubtitle>
            <Field
              type="text"
              name="ordinanceNumber"
              placeholder={texts.ordinanceNumber}
              component={TextInput}
            />
            <ErrorMessage name="ordinanceNumber" component="div" />
          </div>

          <div>
            <InputSubtitle>{texts.ordinanceFile}</InputSubtitle>
            <input
              className="relative m-0 ml-4 block min-w-0 flex-auto rounded
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
            <ErrorMessage name="file" component="div" />
          </div>

          <Button
            disabled={isSubmitting}
            type="submit"
            className="ml-4 w-64"
            color={Colors.Primary}
          >
            {texts.add}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

function InputSubtitle({ children }: { children: React.ReactNode }) {
  return <Subtitle className="ml-4 mb-2">{children}</Subtitle>;
}
