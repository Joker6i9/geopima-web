import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyRow({ cols, children = "Nothing matches your filters." }: { cols: number; children?: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="py-10 text-center text-muted-foreground">{children}</TableCell>
    </TableRow>
  );
}
