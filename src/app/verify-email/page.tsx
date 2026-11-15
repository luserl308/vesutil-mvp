"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerificationContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Проверяем ссылку подтверждения…");

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState("error");
      setMessage("В ссылке отсутствует токен подтверждения.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const data = await response.json();
      if (cancelled) return;
      setState(response.ok ? "success" : "error");
      setMessage(data.message || data.error || "Не удалось подтвердить адрес.");
    }).catch(() => {
      if (cancelled) return;
      setState("error");
      setMessage("Не удалось связаться с сервером. Попробуйте открыть ссылку ещё раз.");
    });
    return () => { cancelled = true; };
  }, [token]);

  return <section className="hero" style={{ minHeight: "65vh" }}>
    <div className="eyebrow">VESUTIL · АККАУНТ</div>
    <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>
      {state === "success" ? "Почта подтверждена" : state === "error" ? "Не удалось подтвердить" : "Подтверждение почты"}
    </h1>
    <p>{message}</p>
    {state === "success" && <p><Link href="/company">Перейти в кабинет компании</Link></p>}
    {state === "error" && <p>Ссылка может быть просрочена или уже использована.</p>}
    <p><Link href="/">← На главную Vesutil</Link></p>
  </section>;
}

export default function VerifyEmailPage() {
  return <main>
    <header className="top"><Link className="logo" href="/"><b>V</b> vesutil</Link><nav><Link href="/">Каталог</Link><Link href="/company">Для компаний</Link></nav></header>
    <Suspense fallback={<section className="hero"><p>Загружаем проверку…</p></section>}>
      <VerificationContent />
    </Suspense>
    <footer><Link className="logo" href="/"><b>V</b> vesutil</Link><span>Подтверждение адреса электронной почты</span><span>© 2026 Vesutil</span></footer>
  </main>;
}