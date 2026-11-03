import { ExportMenu } from "@/components/shared/export-menu";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { kes } from "@/lib/format";
import { periodLabel } from "@/lib/dates";
import { getMyStatements } from "@/lib/repo/landlord";

export const metadata: Metadata = { title: "Statements" };

// Reads the signed-in user's data from Django, so navigating here may wait for it.
export const instant = false;

export default async function StatementsPage() {
  const { rows } = await getMyStatements();
  const periods = [...new Set(rows.map((r) => r.period))].sort().reverse();
  const sum = (list: typeof rows, k: "billed" | "collected" | "arrears" | "commission" | "net") => list.reduce((n, r) => n + r[k], 0);

  return (
    <>
      <PageHeader title="Statements" description="Monthly rent collected, commission and the amount payable to you." actions={<ExportMenu dataset="statements" />} />
      <div className="space-y-4">
        {periods.map((period) => {
          const list = rows.filter((r) => r.period === period);
          return (
            <Card key={period}>
              <CardHeader><CardTitle>{periodLabel(period)}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Arrears</TableHead><TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net to you</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r) => (
                      <TableRow key={r.propertyId}>
                        <TableCell className="font-medium">{r.property}</TableCell>
                        <TableCell className="text-right tabular-nums">{kes(r.billed)}</TableCell>
                        <TableCell className="text-right tabular-nums">{kes(r.collected)}</TableCell>
                        <TableCell className="text-right tabular-nums">{kes(r.arrears)}</TableCell>
                        <TableCell className="text-right tabular-nums">{kes(r.commission)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{kes(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Total</TableCell>
                      {(["billed", "collected", "arrears", "commission", "net"] as const).map((k) => (
                        <TableCell key={k} className="text-right tabular-nums">{kes(sum(list, k))}</TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
