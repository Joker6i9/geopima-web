import { redirect } from "next/navigation";

// The proxy sends signed-in users to their portal; this covers everyone else.
export default function Home() {
  redirect("/login");
}
