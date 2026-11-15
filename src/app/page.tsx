import Link from "next/link";

const steps = [
  ["1", "Register", "Create your account with your phone number."],
  ["2", "Apply & pay", "Fill the form, upload documents, pay by mobile money."],
  ["3", "Verify remotely", "Take a selfie with a liveness check - no queue."],
  ["4", "Get your service", "Track progress live. Visit only if a fingerprint scan is legally required."],
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-lib-blue to-blue-800 p-8 text-white md:p-12">
        <h1 className="max-w-2xl text-3xl font-bold md:text-4xl">Government services, from the comfort of your home.</h1>
        <p className="mt-3 max-w-xl text-blue-100">
          Passport, National ID, driver&apos;s license, business registration, tax and more - one account, one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/services" className="btn btn-red">Browse services</Link>
          <Link href="/track" className="btn btn-ghost">Track an application</Link>
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, d]) => (
            <div key={n} className="card">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-lib-light font-bold text-lib-blue">{n}</div>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
