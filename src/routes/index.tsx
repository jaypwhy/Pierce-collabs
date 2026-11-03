import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

const steps = [
  {
    number: "01",
    title: "Tell us what you're locked into",
    body: "A subscription, a phone or internet contract, a gym, a loan. The provider, the monthly cost, and how long is left.",
  },
  {
    number: "02",
    title: "See what it actually costs",
    body: "Not the monthly price — the full remaining obligation, in one number, with the exit terms spelled out in plain language.",
  },
  {
    number: "03",
    title: "Send the letter",
    body: "A ready-to-send cancellation or exit letter, written for you and filled in with your details. Copy it and go.",
  },
];

const gimmicks = [
  {
    name: "The free trial that isn't",
    body: "Seven days free, then a paid subscription — unless you remember to cancel on the one day nobody reminds you about.",
  },
  {
    name: "Negative-option billing",
    body: "You're charged every month until you actively cancel. Silence is treated as consent.",
  },
  {
    name: "Drip pricing",
    body: "The advertised price grows as you reach the checkout: booking fee, service fee, card fee, admin fee.",
  },
  {
    name: "Bait and switch",
    body: "The deal you clicked is 'no longer available' by the time you get to the basket, and here's a worse one.",
  },
  {
    name: "The teaser rate",
    body: "A low rate for the first year that resets to something far higher, quietly, at the worst possible moment.",
  },
  {
    name: "Bundled lock-in",
    body: "The thing you actually want is only sold with a 24-month term attached to it.",
  },
  {
    name: "Cancellation by phone only",
    body: "Sign up in one click; cancel in a queue, during office hours, against a retention script.",
  },
  {
    name: "The renewal window",
    body: "It rolls over for another year unless you cancel inside a narrow window that is easy to miss.",
  },
  {
    name: "The exit fee that costs more than staying",
    body: "Early termination priced deliberately high, so leaving feels irrational even when you want to.",
  },
  {
    name: "The loyalty penalty",
    body: "New customers get the better price. The ones who stay get the annual increase.",
  },
];

const clauses = [
  {
    name: "Cooling-off period",
    body: "A window right after signing where you can cancel and walk away, no reason needed.",
  },
  {
    name: "Price-increase exit",
    body: "If they raise the price mid-term, you may be entitled to leave without paying a fee.",
  },
  {
    name: "Break clause",
    body: "A named point in a fixed term where the contract can be ended early.",
  },
  {
    name: "Buyout / early termination",
    body: "A defined amount that replaces the whole remaining term — often far less than it sounds.",
  },
  {
    name: "Porting or transfer",
    body: "Moving the contract to another address or another person instead of cancelling it.",
  },
  {
    name: "Change of circumstances",
    body: "Clauses that let you out on moving house, illness, redundancy or bereavement.",
  },
  {
    name: "Notice period",
    body: "How much warning they need, and how they insist on receiving it — post, phone, in writing.",
  },
  {
    name: "Auto-renewal notice",
    body: "The reminder they are, or aren't, obliged to send before rolling you into another term.",
  },
  {
    name: "Statutory cancellation rights",
    body: "Rights the law gives you regardless of what the contract's own wording says.",
  },
  {
    name: "Escalation route",
    body: "The regulator or ombudsman that can overrule a 'no' from the call centre.",
  },
];

function Home() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">Pierce Collabs</span>
        <div className="flex items-center gap-4">
          <Link
            to="/art"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Art studio
          </Link>
          <Link
            to="/sip-drip"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Sip Drip
          </Link>
          <Link
            to="/balance"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Balance
          </Link>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Placeholder concept
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <section className="pt-10 sm:pt-16">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Find out what your lock-in is really costing you.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            A free tool that takes the guesswork out of getting free of a contract. Enter what
            you're tied into, see the real remaining cost, and get a plain-language exit letter you
            can send the same day. No account, no sign-up, nothing to cancel.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            How it would work
          </h2>
          <ol className="mt-6 space-y-6">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-5 border-t border-slate-200 pt-6">
                <span className="mt-1 text-sm font-semibold text-slate-400">{step.number}</span>
                <div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-slate-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            The gimmicks we'd name
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            The same handful of sales models show up again and again, wearing different costumes.
            Naming them is half the work — the other half is knowing which one you're inside.
          </p>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {gimmicks.map((item) => (
              <div key={item.name} className="border-t border-slate-200 pt-4">
                <dt className="text-sm font-semibold">{item.name}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Escape clauses worth looking for
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            Almost every contract contains a way out. It is usually buried, badly named, and
            written to be missed — but it is there.
          </p>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {clauses.map((item) => (
              <div key={item.name} className="border-t border-slate-200 pt-4">
                <dt className="text-sm font-semibold">{item.name}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-2xl rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">
            These are examples, not legal advice. Which of them apply — and what they actually say
            — depends on your country and the terms of your own contract.
          </p>
        </section>

        <section className="mt-16 rounded-2xl bg-slate-50 p-8">
          <h2 className="text-base font-semibold">Who it's for</h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            Anyone who has ever paid a cancellation fee because they didn't know the terms, or kept
            paying for something for months because leaving felt like more effort than staying.
          </p>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold">About this page</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            This is a placeholder: a first concept written down so we have something concrete to
            react to. The actual product — its strategy and how it charges — is still being
            defined. Nothing on this page is a working tool yet, and nothing here is a promise of a
            price, a saving, or a legal outcome.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <p className="mx-auto max-w-3xl px-6 text-xs text-slate-400">
          Pierce Collabs — draft concept, not yet launched.
        </p>
      </footer>
    </div>
  );
}
