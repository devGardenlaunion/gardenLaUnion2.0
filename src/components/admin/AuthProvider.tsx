"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Guard doble: variable explícita Y solo en desarrollo.
// Aunque alguien olvide esta var en producción, NODE_ENV será "production" y no activará.
const DEV_SKIP =
  process.env.NEXT_PUBLIC_SKIP_AUTH === "true" &&
  process.env.NODE_ENV === "development";

const DEV_SESSION: Session = {
  user: { name: "Dev Admin", email: "dev@localhost", image: null },
  expires: "2099-12-31T00:00:00.000Z",
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={DEV_SKIP ? DEV_SESSION : undefined}>
      {children}
    </SessionProvider>
  );
}
