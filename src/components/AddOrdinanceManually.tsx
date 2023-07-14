'use client';

import { Button, DatePicker, Subtitle, TextInput, Title } from "@tremor/react";
import { Colors } from "@/styles/Themes";
import { cs } from "date-fns/locale";
import { texts } from "@/utils/shared/texts";

export default function AddOrdinanceManually() {
  return (
    <>
      <Title className="px-2 py-3 mb-2">
        {texts.addOrdinanceManually}
      </Title>
      <Subtitle>
        {texts.ordinanceName}
      </Subtitle>
      <TextInput
        className="mb-6 mt-2"
        placeholder={texts.fillOutName}
      />
      <Subtitle>
        {texts.validFrom}
      </Subtitle>
      <DatePicker
        className="mb-6 mt-2"
        placeholder={texts.selectDate}
        locale={cs}
      />
      <Subtitle>
        {texts.validTo}
      </Subtitle>
      <DatePicker
        className="mb-6 mt-2"
        placeholder={texts.selectDate}
        locale={cs}
      />
      <Button
        className="w-full mt-4"
        color={Colors.Primary}
      >
        {texts.add}
      </Button>
    </>
  );
}