import Link from "next/link";
import vi from "@messages/vi.json";

export default function Site2Pricing() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-16 text-center">
      <h1 className="text-3xl font-bold">{vi.pricing.title}</h1>
      <p className="mt-2 opacity-70">{vi.pricing.subtitle}</p>
      <div className="mt-8 rounded-2xl border border-[#e5dcc8] bg-white/60 p-8">
        <h2 className="text-xl font-bold">{vi.pricing.planName}</h2>
        <p className="mt-2 text-3xl font-bold">{vi.pricing.planPrice}</p>
        <ul className="mt-6 space-y-2 text-left text-sm">
          {vi.pricing.features.map((feature) => (
            <li key={feature}>• {feature}</li>
          ))}
        </ul>
        <Link href="/mau-thiep"
          className="mt-8 inline-block rounded-full bg-[#9a6a42] px-6 py-2.5 text-sm font-semibold text-white"
        >
          {vi.pricing.planCta}
        </Link>
      </div>
    </div>
  );
}
