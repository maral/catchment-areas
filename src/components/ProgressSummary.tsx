import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type StatusCount,
  calculateCompletionPercentage,
  getStatusConfig,
} from "@/utils/client/progress";
import { texts } from "@/utils/shared/texts";

interface ProjectProgressSummaryProps {
  statusCounts: StatusCount[];
  totalProjects: number;
  className?: string;
}

export function ProgressSummary({
  statusCounts,
  totalProjects,
  className,
}: ProjectProgressSummaryProps) {
  const completionPercentage = calculateCompletionPercentage(statusCounts);

  return (
    <Card className={cn("", className)}>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{texts.progress}</h3>
            <span className="text-sm font-medium">
              {completionPercentage}% dokončeno
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            {statusCounts.map((statusCount) => {
              const config = getStatusConfig(statusCount.status);
              const width =
                totalProjects > 0
                  ? (statusCount.count / totalProjects) * 100
                  : 0;

              return (
                <div
                  key={statusCount.status}
                  className={cn(config.color, "h-full")}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-1">
            {statusCounts.map((statusCount) => {
              const config = getStatusConfig(statusCount.status);

              return (
                <div
                  key={statusCount.status}
                  className="flex items-center gap-1.5"
                >
                  <div className={cn("w-3 h-3 rounded-sm", config.color)} />
                  <span className="text-xs font-medium">
                    {config.label}: {statusCount.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
