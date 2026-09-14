import vi from "@messages/vi.json";

export default function Site2NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{vi.demo.notFoundTitle}</h1>
      <p className="mt-2 opacity-70">{vi.demo.notFoundBody}</p>
    </div>
  );
}
