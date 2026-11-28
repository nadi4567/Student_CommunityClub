import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

export function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const justRegistered = searchParams.get("registered") === "1";

  useEffect(() => {
    const remembered = localStorage.getItem("scc-remember-email");
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  function safeNext() {
    const next = searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    return "/app/dashboard";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = await login(email, password);
    if (msg) {
      setError(msg);
      return;
    }
    if (remember) localStorage.setItem("scc-remember-email", email);
    navigate(safeNext());
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f8ff] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">Welcome Back!</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Log in to your account to continue.</p>
        {justRegistered ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            Account created. Sign in before you join a club.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Email Address">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300"
              />
              Remember me
            </label>
            <button type="button" className="text-brand" onClick={() => setForgot(true)}>
              Forgot password?
            </button>
          </div>
          {forgot ? (
            <p className="text-sm text-amber-700">
              Password reset is not available yet. Please contact an administrator or register a new account.
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full py-3" type="submit">
            Login
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-brand">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
