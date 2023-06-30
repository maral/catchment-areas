import { Badge, Card, Subtitle } from "@tremor/react"
import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";

export default function OverviewBox({
  className
}: {
  className?: string
}) {
  return (
    <Card className={`${className ?? ''}`}>
      <div className="mb-4">
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">Stav:</Subtitle>
          <Badge color="emerald">Aktuální</Badge>
        </div>
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">Počet škol:</Subtitle>
          <Subtitle>10</Subtitle>
        </div>
      </div>
      <OverviewBoxButtons />
    </Card>
  );
}
