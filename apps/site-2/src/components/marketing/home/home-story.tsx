import { Camera, MapPin, Heart } from "lucide-react";
import vi from "@messages/vi.json";
import { HomeRsvp } from "./home-rsvp";

const icons = [Camera, MapPin, Heart];

export function HomeStory() {
  return (
    <>
      <section className="s2-home-section s2-home-story" aria-labelledby="home-story-title">
        <header className="s2-home-centered">
          <h2 id="home-story-title" className="s2-display s2-home-heading">{vi.home.valueTitle}</h2>
          <p className="s2-home-intro">{vi.home.valueSubtitle}</p>
        </header>
        <div className="s2-home-feature-list">
          {vi.home.value.map((feature, index) => {
            const Icon = icons[index];
            return <article key={feature.title}>
              <Icon size={28} strokeWidth={1.25} aria-hidden="true" />
              <h3 className="s2-display">{feature.title}</h3>
              <p>{feature.body}</p>
            </article>;
          })}
        </div>
      </section>
      <HomeRsvp />
    </>
  );
}
