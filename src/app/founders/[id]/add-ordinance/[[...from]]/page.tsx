'use client';

import Header from "@/components/common/Header";
import HeaderBox from "@/components/common/HeaderBox";
import OrdinanceMetadataTable from "@/components/table/tableWrappers/OrdinanceMetadataTable";
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Button, Card, DatePicker, Subtitle, TextInput } from "@tremor/react";
import { cs } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function AddOrdinance({
  params: { id },
} : {
  params: { id: string },
}) {
  const router = useRouter();

  const addOrdinanceFromCollection = async (ordinanceMetadataId: string) => {
    const response = await fetch('/api/ordinance/add-from-collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        founderId: id,
        ordinanceMetadataId
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        router.push(`${routes.founders}/${id}${routes.editOrdinance}/${result.ordinanceId}`);
        return;
      }
    }
    // @todo show error here
  };
  
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-5 flex">
        <Card className="grow m-1">
        <HeaderBox title={texts.addOrdinanceFromCollection} />
        <OrdinanceMetadataTable founderId={id} addOrdinance={addOrdinanceFromCollection} />
        </Card>
      </div>
      {/* BOTTOM PART OF THE VIEW */}
      <div className="h-1/2 p-1">
        <Card className="h-full">
          <div className="w-1/3 mx-auto my-8">
            <div className="flex justify-center mb-10">
              <Header className="shrink">
                {texts.addOrdinanceManually}
              </Header>
            </div>
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
