import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto py-16">
      <div className="mx-auto max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Fundraise without the friction
        </h1>
        <p className="text-xl text-muted-foreground">
          Generate SAFEs and convertible notes, manage your cap table, and close
          rounds end-to-end. Built for founders and investors.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border px-6 py-3 hover:bg-accent"
          >
            Sign in
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">For Founders</h3>
            <p className="text-sm text-muted-foreground">
              Issue SAFEs and notes, manage your cap table, and close rounds without a lawyer for every step.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">For Investors</h3>
            <p className="text-sm text-muted-foreground">
              Review terms, sign, and fund deals in one place. Track your portfolio and conversion events.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Selective Disclosure</h3>
            <p className="text-sm text-muted-foreground">
              Prove key facts (founder control, accreditation) without revealing sensitive data. Powered by Midnight.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
