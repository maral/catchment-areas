import { api } from "@/app/api/[...remult]/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CityController } from "@/controllers/CityController";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { PublicSwitchButton } from "@/components/buttons/PublicSwitchButton";

export default async function DataPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { type } = searchParams;

  const selectedType =
    type === "ms" ? SchoolType.Kindergarten : SchoolType.Elementary;

  const { founders, ordinances } = await api.withRemult(async () => {
    const cities = await CityController.loadPublishedCities(selectedType);
    const ordinances = await CityController.loadActiveOrdinancesByCityCodes(
      cities.map((f) => f.code),
      selectedType
    );
    return { founders: cities, ordinances };
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href={"/"}>
            <ChevronLeftIcon className="w-4 text-black mr-1" />
            Zpět na mapu
          </Link>
        </Button>
        <h1 className="text-3xl font-title font-semibold mt-4 mb-2">
          {texts.dataForDownload}
        </h1>
        <p className="text-muted-foreground mb-4">
          Stáhněte si text vyhlášky (v původním formátu), polygony spádových
          oblastí ve formátu GeoJSON nebo GPS body adresních míst rozřazené k
          jejich spádovým školám.
        </p>
        <div className="w-fit">
          <PublicSwitchButton />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border shadow-xs">
        <Table>
          <colgroup>
            <col span={1} style={{ width: "50%" }} />
            <col span={1} style={{ width: "50%" }} />
            <col span={1} style={{ width: "1%" }} />
            <col span={1} style={{ width: "1%" }} />
            <col span={1} style={{ width: "1%" }} />
          </colgroup>

          <TableHeader>
            <TableRow>
              <TableHead>Město</TableHead>
              <TableHead>Kraj</TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {founders.map((city) => {
              const ordinance = ordinances[city.code];

              if (!ordinance) {
                return null;
              }
              return (
                <TableRow key={city.code}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.regionName}</TableCell>
                  <TableCell>
                    {ordinance.fileName && (
                      <Button variant="default" size="sm" asChild>
                        <Link
                          href={`/api/ordinances/download/by-id/${ordinance.id}`}
                          prefetch={false}
                          target="_blank"
                        >
                          <ArrowDownTrayIcon className="w-4 text-white mr-1" />
                          Text vyhlášky
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {ordinance.hasPolygons && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/api/download/polygons/${ordinance.id}`}
                          prefetch={false}
                          target="_blank"
                        >
                          <ArrowDownTrayIcon className="w-4 text-black mr-1" />
                          Polygony (.geojson)
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {ordinance.hasJsonData && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/api/download/address-points/${ordinance.id}`}
                          prefetch={false}
                          target="_blank"
                        >
                          <ArrowDownTrayIcon className="w-4 text-black mr-1" />
                          Adresní místa (.json)
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
