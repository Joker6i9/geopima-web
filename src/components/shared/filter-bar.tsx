import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}

/** GET form so filters live in the URL and work without client JS. */
export function FilterBar({
  action, search, placeholder = "Search…", selects = [],
}: {
  action: string;
  search: string;
  placeholder?: string;
  selects?: FilterSelect[];
}) {
  const active = !!search || selects.some((s) => s.value);
  return (
    <form action={action} className="mb-4 flex flex-wrap gap-2" role="search">
      <Input name="search" defaultValue={search} placeholder={placeholder} aria-label="Search" className="w-full max-w-xs" />
      {selects.map((s) => (
        <select
          key={s.name}
          name={s.name}
          defaultValue={s.value}
          aria-label={s.label}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">{s.label}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      <Button type="submit">Filter</Button>
      {active && (
        <Link href={action} className={buttonVariants({ variant: "ghost" })}>Clear</Link>
      )}
    </form>
  );
}
