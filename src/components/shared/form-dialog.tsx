"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ActionState = { ok: boolean; message: string } | null;
type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** Labelled form control. Pass children to supply a custom control such as a select. */
export function Field({
  label, name, type = "text", defaultValue, placeholder, required = true, hint, className, children,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children ?? <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} />}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label, name, options, defaultValue = "", placeholder = "Choose…", required = true, className,
}: {
  label: string;
  name: string;
  options: { value: string | number; label: string }[];
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} name={name} className={className}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

function DialogBody({
  title, description, action, submitLabel, destructive, onDone, children,
}: {
  title: string;
  description?: string;
  action: FormAction;
  submitLabel: string;
  destructive?: boolean;
  onDone: () => void;
  children: React.ReactNode;
}) {
  // Mounted only while the dialog is open, so its state (including any error) resets on every open.
  const [state, formAction, actionPending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result?.ok) {
      toast.success(result.message);
      onDone();
    }
    return result;
  }, null);
  const [, startTransition] = useTransition();
  const pending = actionPending;

  return (
    // onSubmit rather than action={}: React resets uncontrolled fields after a form action, which would wipe the
    // user's input whenever validation fails.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {children}
      {state && !state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <DialogFooter>
        <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending}>
          {pending ? "Working…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** A button that opens a dialog containing a form wired to a server action. */
export function FormDialog({
  trigger, triggerVariant = "outline", triggerSize = "sm", title, description, action, submitLabel, destructive, wide, children,
}: {
  trigger: React.ReactNode;
  triggerVariant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  triggerSize?: "default" | "sm" | "xs";
  title: string;
  description?: string;
  action: FormAction;
  submitLabel: string;
  destructive?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size={triggerSize} />}>{trigger}</DialogTrigger>
      <DialogContent className={wide ? "sm:max-w-lg" : undefined}>
        <DialogBody
          title={title}
          description={description}
          action={action}
          submitLabel={submitLabel}
          destructive={destructive}
          onDone={() => setOpen(false)}
        >
          {children}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
