'use client';

import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { useEffect } from "react";
import { useNavigationContext } from "@/providers/Providers";
import { texts } from "@/utils/texts";
import { Button, Card, TextInput, Title } from "@tremor/react"
import OrdinanceMetasTable from "@/components/table/tableWrappers/OrdinancesMetaTable";
import { DateRangePicker, DateRangePickerValue, Subtitle } from "@tremor/react";
import { Colors } from "@/styles/Themes";

const foundersRepo = remult.repo(Founder);

export default function AddOrdinance({
  params
} : {
  params: { id: string },
}) {
  const { setNavigationItems } = useNavigationContext();
  
  useEffect(() => {
    let founder: Founder | null = null;
    const fetchFounder = async (id: string) => {
      founder = await foundersRepo.findId(Number(id));
      setNavigationItems([
        { href: "/founders", name: texts.founders },
        { href: `/founders/${params.id}`, name: founder?.name ?? '' },
        { href: `/founders/${params.id}/add-ordinance`, name: texts.addOrdinance },
      ]);
    }
    fetchFounder(params.id).catch(console.error);
  }, [params.id, setNavigationItems]);
  
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* TOP PART OF THE VIEW */}
      <div className="h-1/2 pb-5 flex">
        <Card className="grow m-1">
        <Title className="px-2 py-3 mb-2">
          {texts.addOrdinanceFromCollection}
        </Title>
        <OrdinanceMetasTable founderId={params.id} />
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
              // placeholder={texts.ordinanceName}
            />
            <Subtitle className="ml-4">
              {texts.validFrom}
            </Subtitle>
            <DateRangePicker
              className="mb-6 mt-2"
              // placeholder={texts.validFrom}
              onChange={
                (value) => {console.log('onChange', value)}
              }
            />
            <Subtitle className="ml-4">
              {texts.validTo}
            </Subtitle>
            <DateRangePicker
              className="mb-6 mt-2"
              // placeholder={texts.validTo}
            />
            <Button className="w-full" color={Colors.Primary}>
              {texts.add}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
