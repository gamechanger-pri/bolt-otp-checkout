import { FormEvent, useEffect, useState } from "react";
import { EMAIL_RE, recognize, submitCheckout } from "./api";
import LoginModal from "./LoginModal";

const empty = { email: "", phone: "", addressLine: "", city: "", postalCode: "", country: "" };

export default function Checkout() {
  const [f, setF] = useState(empty);
  const [session, setSession] = useState<{ token: string; name: string } | null>(null);
  const [modalFor, setModalFor] = useState<string | null>(null); // email the modal is asking about
  const [skipped, setSkipped] = useState<string | null>(null);   // email the user chose not to log in with
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const email = f.email.trim();
  const emailValid = EMAIL_RE.test(email);

  // Background recognition: fires once a complete email is typed (debounced),
  // never blocks the rest of the form, and cancels stale requests.
  useEffect(() => {
    if (!emailValid || session || email.toLowerCase() === skipped) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const { registered } = await recognize(email, ctrl.signal);
        if (registered) setModalFor(email);
      } catch { /* aborted or offline: the form still works as a guest */ }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [email, emailValid, session, skipped]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try { setDone((await submitCheckout(f, session?.token)).id); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  if (done !== null)
    return (
      <section className="card">
        <h1>Order recorded</h1>
        <p>Reference #{done}. No payment was taken.</p>
        <button className="primary" onClick={() => { setF(empty); setDone(null); }}>Start another</button>
      </section>
    );

  return (
    <>
      <form className="card" onSubmit={submit} noValidate>
        {session && <p className="welcome">Welcome back, {session.name}</p>}
        <h1>Shipping details</h1>
        <label>
          Email
          <input type="email" autoComplete="email" value={f.email} onChange={set("email")}
            onBlur={() => setTouched(true)} aria-invalid={touched && !emailValid} required />
          {touched && !emailValid && <span className="hint error">Enter a complete email address.</span>}
          {emailValid && <span className="hint ok">Looks good</span>}
        </label>
        <label>Phone<input type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} required /></label>
        <label>Address<input autoComplete="address-line1" value={f.addressLine} onChange={set("addressLine")} required /></label>
        <div className="row">
          <label>City<input autoComplete="address-level2" value={f.city} onChange={set("city")} required /></label>
          <label>Postal code<input autoComplete="postal-code" value={f.postalCode} onChange={set("postalCode")} required /></label>
        </div>
        <label>Country<input autoComplete="country-name" value={f.country} onChange={set("country")} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? "Saving…" : "Place order"}</button>
      </form>

      {modalFor && (
        <LoginModal
          email={modalFor}
          onSuccess={(s) => { setSession(s); setModalFor(null); }}
          onSkip={() => { setSkipped(modalFor.toLowerCase()); setModalFor(null); }}
        />
      )}
    </>
  );
}
