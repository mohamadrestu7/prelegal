"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, apiFetch, clearToken } from "@/lib/api";
import DocumentApp from "./components/DocumentApp";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login/");
      return;
    }
    apiFetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("invalid");
        return r.json();
      })
      .then((user) => {
        setUserName(user.name);
        setReady(true);
      })
      .catch(() => {
        clearToken();
        router.replace("/login/");
      });
  }, [router]);

  if (!ready) return null;

  return <DocumentApp userName={userName} />;
}
