import { Button } from "@/components/shadcn/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/Table";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { FounderController } from "../../controllers/FounderController";
import { texts } from "../../utils/shared/texts";
import { api } from "../api/[...remult]/api";

export default async function DataPage() {
  const { founders, ordinances } = await api.withRemult(async () => {
    const founders = await FounderController.loadPublishedFounders(0, 1000);
    const ordinances = await FounderController.loadActiveOrdinancesByFounderIds(
      founders.map((f) => f.id)
    );
    return { founders, ordinances };
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
        <h1 className="text-3xl font-bold mt-4 mb-2">
          {texts.dataForDownload}
        </h1>
        <p className="text-muted-foreground">
          Stáhněte si text vyhlášky (v původním formátu), polygony spádových
          oblastí ve formátu GeoJSON nebo GPS body adresních míst rozřazené k
          jejich spádovým školám.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border shadow-sm">
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
            {founders.map((founder) => {
              const ordinance = ordinances.get(founder.id);

              if (!ordinance) {
                return null;
              }
              return (
                <TableRow key={founder.id}>
                  <TableCell className="font-medium">
                    {founder.shortName}
                  </TableCell>
                  <TableCell>{founder.regionName}</TableCell>
                  <TableCell>
                    {ordinance.fileName && (
                      <Button variant="default" size="sm" asChild>
                        <Link
                          href={`/api/ordinances/download/by-id/${ordinance.id}`}
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
