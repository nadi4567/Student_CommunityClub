import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

export function LoginPage() {
  const { login, resetDemo } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem("scc-remember-email");
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  function safeNext() {
    const next = searchParams.get("next");
    if (next && next.startsWith("/app")) return next;
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

  function fill(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f8ff] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">Welcome Back!</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Log in to your account to continue.</p>
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
              Password reset is demo-only. Use a seeded account below, or register a new student.
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full py-3" type="submit">
            Login
          </Button>
        </form>
        <p className="my-5 text-center text-xs text-slate-400">or continue with</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium"
            onClick={() => setError("Social login is not enabled in this demo. Use email login.")}
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium"
            onClick={() => setError("Social login is not enabled in this demo. Use email login.")}
          >
            <FacebookIcon />
            Facebook
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-brand">
            Register
          </Link>
        </p>
        <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold">Demo accounts</p>
          <button className="block w-full text-left hover:text-brand" onClick={() => fill("alex@example.com", "student123")}>
            Student — alex@example.com / student123
          </button>
          <button className="block w-full text-left hover:text-brand" onClick={() => fill("sarah@example.com", "leader123")}>
            Club leader — sarah@example.com / leader123
          </button>
          <button className="block w-full text-left hover:text-brand" onClick={() => fill("admin@example.com", "admin123")}>
            Admin — admin@example.com / admin123
          </button>
          <button
            type="button"
            className="pt-1 text-left text-brand"
            onClick={() => {
              resetDemo();
              setError(null);
            }}
          >
            Reset demo data
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.7 0 2.9.7 3.6 1.3l2.4-2.4C16.4 3.6 14.4 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.2-1.5H12z" />
      <path fill="#34A853" d="M3.9 7.4l3 2.2C7.7 7.4 9.7 6.2 12 6.2c1.7 0 2.9.7 3.6 1.3l2.4-2.4C16.4 3.6 14.4 2.8 12 2.8 8.4 2.8 5.3 4.8 3.9 7.4z" />
      <path fill="#4285F4" d="M12 21.2c2.4 0 4.4-.8 5.9-2.1l-2.7-2.1c-.8.5-1.8.9-3.2.9-3.5 0-6.5-2.4-7.6-5.6l-3 2.3C3.1 18.7 7.2 21.2 12 21.2z" />
      <path fill="#FBBC05" d="M4.4 14.3c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9l-3-2.3C.5 9.7.2 10.8.2 12s.3 2.3.8 3.4l3.4-1.1z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  );
}
