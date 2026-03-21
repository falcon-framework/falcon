import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Badge } from "@falcon-framework/ui/components/badge";
import { Separator } from "@falcon-framework/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@falcon-framework/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/docs")({
  component: DocsPage,
});

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 overflow-hidden">
      {title && (
        <div className="border-b border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-semibold tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  );
}

function DocsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Falcon Auth SDK</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This console is your account portal — manage your profile, see which
          apps you've signed in to, and control your connections. Below is the
          SDK reference for using Falcon as your authentication provider in any
          React app.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {[
          { label: "Getting Started", href: "#getting-started" },
          { label: "Provider", href: "#provider" },
          { label: "Components", href: "#components" },
          { label: "Hooks", href: "#hooks" },
          { label: "Server-Side", href: "#server-side" },
          { label: "App Registration", href: "#app-registration" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <Separator />

      {/* Getting Started */}
      <Section id="getting-started" title="Getting Started">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Install the SDK in your React app and configure it with your Falcon auth server URL and
            publishable key.
          </p>

          <CodeBlock title="Install">
            {`npm install @falcon-framework/sdk
# or
bun add @falcon-framework/sdk`}
          </CodeBlock>

          <CodeBlock title="src/lib/falcon-auth.ts">
            {`import { createFalconAuth } from "@falcon-framework/sdk";

export const falconAuth = createFalconAuth({
  serverUrl: "https://your-auth-server.example.com",
  publishableKey: "pk_live_your_publishable_key",
});`}
          </CodeBlock>

          <CodeBlock title="src/App.tsx">
            {`import { FalconAuthProvider } from "@falcon-framework/sdk/react";

const config = {
  serverUrl: "https://your-auth-server.example.com",
  publishableKey: "pk_live_your_publishable_key",
};

function App() {
  return (
    <FalconAuthProvider config={config}>
      <YourApp />
    </FalconAuthProvider>
  );
}`}
          </CodeBlock>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>
                Your app needs{" "}
                <Badge variant="secondary" className="text-[10px]">
                  React 18+
                </Badge>{" "}
                and{" "}
                <Badge variant="secondary" className="text-[10px]">
                  Tailwind CSS
                </Badge>{" "}
                for the pre-built components to render correctly.
              </p>
              <p>
                The SDK components use Tailwind utility classes and expect the standard shadcn/ui
                CSS variables to be defined.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Separator />

      {/* Provider */}
      <Section id="provider" title="FalconAuthProvider">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Wrap your app with{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {"<FalconAuthProvider>"}
            </code>{" "}
            to provide auth context to all child components and hooks.
          </p>

          <CodeBlock title="Props">
            {`interface FalconAuthProviderProps {
  config: {
    serverUrl: string;       // Your Falcon auth server URL
    publishableKey: string;  // Your app's publishable key (pk_...)
  };
  children: React.ReactNode;
}`}
          </CodeBlock>
        </div>
      </Section>

      <Separator />

      {/* Components */}
      <Section id="components" title="Pre-built Components">
        <Tabs defaultValue="signin" className="space-y-4">
          <TabsList>
            <TabsTrigger value="signin">{"<SignIn />"}</TabsTrigger>
            <TabsTrigger value="signup">{"<SignUp />"}</TabsTrigger>
            <TabsTrigger value="userbutton">{"<UserButton />"}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Drop-in sign-in form with email and password fields.
            </p>
            <CodeBlock title="Usage">
              {`import { SignIn } from "@falcon-framework/sdk/react";

function LoginPage() {
  return (
    <SignIn
      afterSignInUrl="/dashboard"
      signUpUrl="/register"
      onSignIn={() => console.log("signed in!")}
    />
  );
}`}
            </CodeBlock>
            <CodeBlock title="Props">
              {`interface SignInProps {
  afterSignInUrl?: string;  // Redirect URL after sign-in
  signUpUrl?: string;       // Link to the sign-up page
  onSignIn?: () => void;    // Callback after successful sign-in
  className?: string;       // Additional CSS class
}`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Drop-in sign-up form with name, email, and password fields.
            </p>
            <CodeBlock title="Usage">
              {`import { SignUp } from "@falcon-framework/sdk/react";

function RegisterPage() {
  return (
    <SignUp
      afterSignUpUrl="/dashboard"
      signInUrl="/login"
      onSignUp={() => console.log("signed up!")}
    />
  );
}`}
            </CodeBlock>
            <CodeBlock title="Props">
              {`interface SignUpProps {
  afterSignUpUrl?: string;  // Redirect URL after sign-up
  signInUrl?: string;       // Link to the sign-in page
  onSignUp?: () => void;    // Callback after successful sign-up
  className?: string;       // Additional CSS class
}`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="userbutton" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              User avatar button with dropdown menu showing user info and sign-out.
            </p>
            <CodeBlock title="Usage">
              {`import { UserButton } from "@falcon-framework/sdk/react";

function Header() {
  return (
    <nav className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <UserButton afterSignOutUrl="/login" />
    </nav>
  );
}`}
            </CodeBlock>
            <CodeBlock title="Props">
              {`interface UserButtonProps {
  afterSignOutUrl?: string;  // Redirect URL after sign-out
  className?: string;        // Additional CSS class
}`}
            </CodeBlock>
          </TabsContent>
        </Tabs>
      </Section>

      <Separator />

      {/* Hooks */}
      <Section id="hooks" title="Hooks">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">useFalconAuth()</h3>
            <p className="text-sm text-muted-foreground">
              Full auth state — user, session, loading, sign-out function.
            </p>
            <CodeBlock>
              {`import { useFalconAuth } from "@falcon-framework/sdk/react";

function Dashboard() {
  const { user, session, isLoaded, isSignedIn, signOut } = useFalconAuth();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Not signed in</div>;

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}`}
            </CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">useUser()</h3>
            <p className="text-sm text-muted-foreground">Convenience hook for just the user.</p>
            <CodeBlock>
              {`import { useUser } from "@falcon-framework/sdk/react";

function Profile() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  return <p>{user.email}</p>;
}`}
            </CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">useSession()</h3>
            <p className="text-sm text-muted-foreground">Convenience hook for just the session.</p>
            <CodeBlock>
              {`import { useSession } from "@falcon-framework/sdk/react";

function SessionInfo() {
  const { session, isLoaded } = useSession();
  if (!isLoaded) return null;
  return <p>Session expires: {session?.expiresAt}</p>;
}`}
            </CodeBlock>
          </div>
        </div>
      </Section>

      <Separator />

      {/* Server-Side */}
      <Section id="server-side" title="Server-Side Verification">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">verifySession</code>{" "}
            in your backend to protect API routes. It forwards the session cookie to the Falcon auth
            server and returns the user if valid.
          </p>

          <CodeBlock title="Express.js">
            {`import { verifySession } from "@falcon-framework/sdk/server";

const config = {
  serverUrl: "https://your-auth-server.example.com",
  publishableKey: "pk_live_your_publishable_key",
};

app.get("/api/protected", async (req, res) => {
  const session = await verifySession(config, req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ message: \`Hello, \${session.user.name}\` });
});`}
          </CodeBlock>

          <CodeBlock title="Hono">
            {`import { verifySession } from "@falcon-framework/sdk/server";

const config = {
  serverUrl: "https://your-auth-server.example.com",
  publishableKey: "pk_live_your_publishable_key",
};

app.get("/api/protected", async (c) => {
  const session = await verifySession(config, c.req.raw);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({ message: \`Hello, \${session.user.name}\` });
});`}
          </CodeBlock>
        </div>
      </Section>

      <Separator />

      {/* App Registration */}
      <Section id="app-registration" title="Registering an App">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Manual Setup</CardTitle>
              <CardDescription className="text-xs">
                Apps are registered by inserting a row into the database directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="mb-3">
                Each app needs a row in the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  falcon_auth_app
                </code>{" "}
                table with a unique publishable key and its allowed origins.
              </p>
            </CardContent>
          </Card>

          <CodeBlock title="SQL — Register a new app">
            {`INSERT INTO falcon_auth_app (id, name, publishable_key, allowed_origins, redirect_urls, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'My App',
  'pk_live_' || encode(gen_random_bytes(24), 'hex'),
  '["http://localhost:3000", "https://myapp.example.com"]'::jsonb,
  '["http://localhost:3000/dashboard", "https://myapp.example.com/dashboard"]'::jsonb,
  now(),
  now()
);`}
          </CodeBlock>

          <CodeBlock title="Get your publishable key after insertion">
            {`SELECT publishable_key, allowed_origins
FROM falcon_auth_app
WHERE name = 'My App';`}
          </CodeBlock>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>publishable_key</strong> — Embed this in your frontend code. It identifies
                your app to the auth server.
              </p>
              <p>
                <strong>allowed_origins</strong> — JSON array of origins allowed to make
                cross-origin requests (CORS). Include both local dev and production URLs.
              </p>
              <p>
                <strong>redirect_urls</strong> — JSON array of allowed post-authentication redirect
                URLs.
              </p>
              <p>
                <strong>secret_key_hash</strong> — Optional. PBKDF2-hashed secret for server-side
                API verification.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
