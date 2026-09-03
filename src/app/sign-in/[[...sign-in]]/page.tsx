import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-gutter py-40">
      <SignIn />
    </div>
  );
}
