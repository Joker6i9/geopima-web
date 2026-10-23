import type { Metadata } from "next";
import { Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemo } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Building className="mb-2 size-8 text-primary" />
          <CardTitle className="text-2xl">GeoPima</CardTitle>
          <CardDescription>Sign in to manage your properties</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm demo={isDemo} />
        </CardContent>
      </Card>
    </main>
  );
}
