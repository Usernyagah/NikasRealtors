import aboutPageImage from "@/assets/images/about-page.png";

const About = () => {
  return (
    <section id="about" className="py-12 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="overflow-hidden rounded-[28px] shadow-luxury border border-border/60 bg-card">
          <img
            src={aboutPageImage}
            alt="About Nikas Realty"
            className="block w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
