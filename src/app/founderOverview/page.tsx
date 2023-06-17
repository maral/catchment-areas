import texts from "@/utils/texts";
import FoundersTable from "@/components/table/tableDefinitions/foundersTable";

export default function FounderOverview() {
  return (
    <>
      <div>
        <h1>{ texts.founders }</h1>
        <FoundersTable />
      </div>
    </>
  );
}
