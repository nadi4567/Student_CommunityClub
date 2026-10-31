import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

export function RegisterPage() {
  const { register } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const msg = await register(name, email, password, phone);
    if (msg) {
      setError(msg);
      return;
    }
    navigate("/app/dashboard");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f8ff] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">Create Your Account</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Join our community and start exploring clubs and events today.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Full Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
          </Field>
          <Field label="Email Address">
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </Field>
           <Field label="Phone Number">
             <Input
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
               placeholder="Enter your phone number"
             />
           </Field>

          <Field label="Password">
            <div className="relative">
              <Input
                required
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password">
            <Input
              required
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your password"
            />
          </Field>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full py-3" type="submit">
            Register
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
