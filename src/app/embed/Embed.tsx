"use client";

import { PageType } from "@/types/mapTypes";
import { ChangeEvent, useEffect, useState } from "react";
import { getDefaultParams } from "@/utils/shared/defaultParams";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { texts } from "../../utils/shared/texts";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { ColorPicker } from "../../components/ui/color-picker";
import useDebounceEffect from "../../utils/client/hooks";

export type CitySchools = {
  cityName: string;
  schools: School[];
};

export type School = { izo: string; name: string };

export type City = { code: number; name: string };

export type MunicipalityPageProps = {
  schools: CitySchools[];
  cities: City[];
};

export default function Embed({ schools, cities }: MunicipalityPageProps) {
  const defaults = getDefaultParams("school");

  const [pageType, setPageType] = useState<PageType>("school");
  const [schoolIzo, setSchoolIzo] = useState(schools[0]?.schools[0]?.izo);
  const [cityCode, setCityCode] = useState(cities[0]?.code);
  // const [showSearch, setShowSearch] = useState(defaults.showSearch);
  const [showControls, setShowControls] = useState(defaults.showControls);
  const [fixedColor, setFixedColor] = useState(false);
  const [color, setColor] = useState("#d33d81");

  const url = createUrl(
    pageType,
    schoolIzo,
    cityCode,
    // showSearch,
    showControls,
    fixedColor,
    color
  );

  const handlePageTypeChange = (value: string) => {
    const pageType = value as PageType;
    setPageType(pageType);
    const defaults = getDefaultParams(pageType);
    // setShowSearch(defaults.showSearch);
    setShowControls(defaults.showControls);
  };

  const [iframeUrl, setIframeUrl] = useState(url);

  useDebounceEffect(
    () => {
      setIframeUrl(url);
    },
    300,
    [pageType, schoolIzo, cityCode, showControls, fixedColor, color]
  );

  return (
    <div className="container mx-auto py-12 px-4 text-gray-900">
      <Button variant="outline" size="sm" asChild>
        <Link href={"/"}>
          <ChevronLeftIcon className="w-4 text-black mr-1" />
          Zpět na mapu
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mt-8 mb-8">
        Vložte si mapu školy nebo města na svůj web
      </h1>

      <form className="flex flex-col gap-6">
        <div className="grid gap-4">
          <Label>Pro koho chcete mapu vytvořit?</Label>
          <RadioGroup
            defaultValue="school"
            value={pageType}
            onValueChange={handlePageTypeChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="school" id="school" />
              <Label htmlFor="school">{texts.school}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="city" id="city" />
              <Label htmlFor="city">{texts.city}</Label>
            </div>
          </RadioGroup>
        </div>

        {pageType === "school" && (
          <div className="grid gap-4">
            <Label htmlFor="school">Vyberte školu</Label>
            <select
              value={schoolIzo}
              onChange={(e) => setSchoolIzo(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            >
              {schools.map((city, index) => (
                <optgroup key={index} label={city.cityName}>
                  {city.schools.map(({ name, izo }) => (
                    <option key={izo} value={izo} className="py-1">
                      {name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {pageType === "city" && (
          <div className="grid gap-4">
            <Label htmlFor="municipality">Vyberte město</Label>
            <select
              value={cityCode}
              onChange={(e) => setCityCode(Number(e.target.value))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            >
              {cities.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showControls"
              checked={showControls}
              onCheckedChange={(value) => setShowControls(Boolean(value))}
            />
            <label
              htmlFor="showControls"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Zobrazit ovládání mapy (přiblížení / oddálení)
            </label>
          </div>

          {pageType === "school" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fixedColor"
                checked={fixedColor}
                onCheckedChange={(value) => setFixedColor(Boolean(value))}
              />
              <label
                htmlFor="fixedColor"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Vlastní barva značek školy a adresních míst
              </label>
            </div>
          )}

          {pageType === "school" && fixedColor && (
            <ColorPicker value={color} onChange={setColor} />
          )}
        </div>
      </form>

      <EmbedCode url={url} />

      <iframe
        className="mt-6 rounded-lg border shadow-xs"
        width="100%"
        height="500px"
        src={iframeUrl}
      />
    </div>
  );
}

const EmbedCode = ({ url }: { url: string }) => {
  return (
    <Card className="my-6">
      <CardHeader className="p-4 rounded-t-lg overflow-hidden bg-slate-50 border-b font-medium text-sm">
        Kód pro vložení do stránky
      </CardHeader>
      <CardContent className="p-4">
        <pre className="mb-0 text-wrap">
          &lt;iframe src=&quot;{url}&quot; width=&quot;100%&quot;
          height=&quot;600px&quot; frameborder=&quot;0&quot;&gt;&lt;/iframe&gt;
        </pre>
      </CardContent>
    </Card>
  );
};

const createUrl = (
  pageType: PageType,
  schoolIzo: string,
  cityCode: number,
  // showSearch: boolean,
  showControls: boolean,
  fixedColor: boolean,
  color: string
): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    "https://mapaspadovosti.zapojmevsechny.cz";

  const path = pageType === "school" ? `/s/${schoolIzo}` : `/m/${cityCode}`;

  const params = new URLSearchParams();
  // params.set("search", showSearch ? "1" : "0");
  params.set("controls", showControls ? "1" : "0");
  if (pageType === "school" && fixedColor) {
    params.set("color", color.slice(1));
  }
  return `${baseUrl}${path}?${params.toString()}`;
};
