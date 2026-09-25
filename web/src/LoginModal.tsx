import { FormEvent, useEffect, useState } from "react";
import { login } from "./api";

type Props = {
  email: string;
  onSuccess: (s: { token: string; name: string }) => void;
  onSkip: () => void;
};

export default function LoginModal({ email, onSuccess, onSkip }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onSkip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await login(email, code);
      onSuccess({ token: r.token, name: `${r.firstName} ${r.lastName}` });
    } catch (err) {
      setError((err as Error).message);
      setCode("");
    } finally { setBusy(false); }
  }

  return (
    <div className="backdrop">
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="mt" onSubmit={submit}>
        <h2 id="mt">We know this email</h2>
        <p>Enter the 6-digit code you got when you registered <b>{email}</b>.</p>
        <input className="codeinput" autoFocus inputMode="numeric" autoComplete="one-time-code"
          maxLength={6} pattern="[0-9]{6}" value={code} aria-label="6-digit code"
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onSkip}>Continue without logging in</button>
          <button className="primary" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Log in"}</button>
        </div>
      </form>
    </div>
  );
}
