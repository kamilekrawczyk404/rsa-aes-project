import Hero from "./Hero.tsx";
import ApplicationFeatures from "./ApplicationFeatures.tsx";
import AlgorithmsDescription from "./AlgorithmsDescriptions.tsx";

const Welcome = () => {
  return (
    <div className="rounded-lg">
      <Hero />

      <ApplicationFeatures />

      <AlgorithmsDescription />
    </div>
  );
};

export default Welcome;
