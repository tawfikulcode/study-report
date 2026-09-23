import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Mail, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/particles";

export const Route = createFileRoute("/login")({ component: Login });

const ALLOWED_EMAIL = "tawfikul2009@gmail.com";
const ALLOWED_PASS = "tawfikka123";

function Login() {
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ALLOWED_EMAIL || password !== ALLOWED_PASS) {
      setError(
        "অনুমোদিত ইমেইল বা পাসওয়ার্ড সঠিক নয়। কেবল tawfikul2009@gmail.com লগইন করতে পারবে।",
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Try to sign in first
      const { error: signInError } = await authClient.signIn.email({
        email: ALLOWED_EMAIL,
        password: ALLOWED_PASS,
      });

      if (signInError) {
        // 2. If sign in fails, attempt sign up (first time account creation)
        const { error: signUpError } = await authClient.signUp.email({
          email: ALLOWED_EMAIL,
          password: ALLOWED_PASS,
          name: "Tawfikul",
        });

        if (signUpError) {
          // 3. Retry sign in one last time
          const { error: retryError } = await authClient.signIn.email({
            email: ALLOWED_EMAIL,
            password: ALLOWED_PASS,
          });
          if (retryError) {
            const errDetail =
              retryError.message ||
              signUpError.message ||
              signInError.message ||
              "লগইন ব্যর্থ হয়েছে।";
            throw new Error(errDetail);
          }
        }
      }

      // Successful login
      window.location.href = "/app";
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "লগইন করতে ব্যর্থ হয়েছে।";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mesh-bg relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <ParticleField />
      <div className="glass-panel relative z-10 w-full max-w-md rounded-xl p-6 md:p-8">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">
          StudyReport AI
        </p>
        <h1 className="font-display mt-2 text-2xl font-semibold">
          Single User Sign-in
        </h1>
        <p className="mt-2 text-sm text-muted">
          প্রাইভেট স্টাডি ওএস। শুধুমাত্র নির্দিষ্ট একাউন্ট দিয়ে প্রবেশ করা
          যাবে।
        </p>

        {error ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface/80 py-2.5 pr-3 pl-9 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="tawfikul2009@gmail.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface/80 py-2.5 pr-10 pl-9 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full gap-2">
            <LogIn className="size-4" />
            {loading ? "লগইন হচ্ছে..." : "Sign in"}
          </Button>
        </form>

        <SignedIn>
          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to="/app">Already signed in — enter workspace</Link>
          </Button>
        </SignedIn>
      </div>
    </main>
  );
}
