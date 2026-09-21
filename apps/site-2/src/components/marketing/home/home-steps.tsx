import Link from "next/link";
import vi from "@messages/vi.json";

export function HomeSteps() {
  return (
    <section className="s2-home-section s2-home-steps" aria-labelledby="home-steps-title">
      <div className="s2-home-steps-heading" data-home-reveal>
        <h2 id="home-steps-title" className="s2-display s2-home-heading">{vi.home.stepsTitle}</h2>
        <p className="s2-home-intro">{vi.home.stepsSubtitle}</p>
        <Link href="/huong-dan" className="s2-home-link">{vi.home.stepsLink}<span aria-hidden="true">↗</span></Link>
      </div>
      <ol className="s2-home-step-list">
        {vi.home.steps.map((step, index) => (
          <li key={step.title} data-home-step-card>
            <span className="s2-display s2-home-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="s2-display">{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
