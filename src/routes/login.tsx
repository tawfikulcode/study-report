import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/particles";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const google = GROK_PROVIDERS.find((p) => p.idp === "google");

  return (
    <main className="mesh-bg relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <ParticleField />
      <div className="glass-panel relative z-10 w-full max-w-sm rounded-xl p-6">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">StudyReport AI</p>
        <h1 className="font-display mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Continue with Google to sync streaks, XP, and report cards across devices.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {authEnabled ? (
            google ? (
              <Button onClick={() => signIn(google.providerId, { callbackURL: "/app" })}>
                Continue with Google
              </Button>
            ) : null
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <SignedIn>
          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to="/app">Already signed in — enter workspace</Link>
          </Button>
        </SignedIn>
      </div>
    </main>
  );
}
