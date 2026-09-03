import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-gutter py-40">
      <SignUp />
    </div>
  );
}
