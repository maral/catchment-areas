export default function RegionFounderPage({
  params: { code, id },
}: {
  params: { code: string, id: string },
}) {
  return (
    <div>
      {code} {id}
    </div>
  );
}