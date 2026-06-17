"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MndaApp from "./components/MndaApp";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("loggedIn")) {
      router.replace("/login/");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return <MndaApp />;
}
