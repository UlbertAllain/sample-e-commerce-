import { RegisterClient } from "./register-client";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <RegisterClient nextPath={next?.startsWith("/") ? next : "/account"} />;
}
