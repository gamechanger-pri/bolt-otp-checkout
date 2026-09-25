import { FormEvent, useState } from "react";
import { EMAIL_RE, register } from "./api";

export default function Register({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ email: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const email = f.email.trim();
    const firstName = f.firstName.trim();
    const lastName = f.lastName.trim();
    if (!EMAIL_RE.test(email)) return setError("Enter a complete email address.");
    if (!firstName || !lastName) return setError("Enter your first and last name.");
    if (firstName.length > 100 || lastName.length > 100) return setError("Names must be 100 characters or fewer.");
    setBusy(true);
    try { setCode((await register({ email, firstName, lastName })).code); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  if (code)
    return (
      <section className="card">
        <h1>You're registered</h1>
        <p>Your login code is below. It won't be shown again, so write it down.</p>
        <p className="code" aria-label={`Login code ${code.split("").join(" ")}`}>{code}</p>
        <button className="primary" onClick={onDone}>Go to checkout</button>
      </section>
    );

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h1>Create your account</h1>
      <label>Email<input type="email" autoComplete="email" value={f.email} onChange={set("email")} required /></label>
      <div className="row">
        <label>First name<input autoComplete="given-name" value={f.firstName} onChange={set("firstName")} required /></label>
        <label>Last name<input autoComplete="family-name" value={f.lastName} onChange={set("lastName")} required /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? "Registering…" : "Register"}</button>
    </form>
  );
}
