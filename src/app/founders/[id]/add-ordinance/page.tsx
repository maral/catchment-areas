'use client';

import { texts } from "@/utils/texts";
import { Button, Card, TextInput, Title } from "@tremor/react"
import OrdinanceMetadataTable from "@/components/table/tableWrappers/OrdinanceMetadataTable";
import { DatePicker, Subtitle } from "@tremor/react";
import { Colors } from "@/styles/Themes";
import { cs } from "date-fns/locale";

export default function AddOrdinance({
  params
} : {
  params: { id: string },
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-5 flex">
        <Card className="grow m-1">
        <Title className="px-2 py-3 mb-2">
          {texts.addOrdinanceFromCollection}
        </Title>
        <OrdinanceMetadataTable founderId={params.id} />
        </Card>
      </div>
      {/* BOTTOM PART OF THE VIEW */}
      <div className="h-1/2 p-1">
        <Card className="h-full">
          <div className="w-1/4">
            <Title className="px-2 py-3 mb-2">
              {texts.addOrdinanceManually}
            </Title>
            <Subtitle className="ml-4">
              {texts.ordinanceName}
            </Subtitle>
            <TextInput
              className="mb-6 mt-2"
              placeholder={texts.fillOutName}
            />
            <Subtitle className="ml-4">
              {texts.validFrom}
            </Subtitle>
            <DatePicker
              className="mb-6 mt-2"
              placeholder={texts.selectDate}
              locale={cs}
              onChange={
                (value) => {console.log('onChange', value)}
              }
            />
            <Subtitle className="ml-4">
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
          </div>
        </Card>
      </div>
    </div>
  );
}
