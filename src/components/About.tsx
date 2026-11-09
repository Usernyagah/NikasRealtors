import { useEffect, useState } from "react";
import { Building2, Award, Users, TrendingUp } from "lucide-react";
import aboutImage from "@/assets/images/about-page.jpg";
import { teamService, type TeamMember as DBTeamMember } from "@/services/firestore/team";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

const About = ({ headingAsPage = false }: { headingAsPage?: boolean }) => {
  const HeadingTag = headingAsPage ? "h1" : "h2";
  const [dynamicMembers, setDynamicMembers] = useState<DBTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const hardcodedMembers = [
    {
      id: 'native-monica',
      name: 'Monicah Githinji',
      role: 'Lead Estate Agent',
      photo: '/images/1000292924.jpg',
      bio: 'Monicah is passionate about matching clients to the perfect property and is known for her expertise and client-first approach throughout all stages of the buying and selling experience.',
    },
    {
      id: 'native-brian',
      name: 'Brian Wachira',
      role: 'Estate Agent',
      photo: '/images/1000295242.jpg',
      bio: 'Brian is committed to delivering seamless real estate services, leveraging local knowledge and strong client relationships to achieve successful outcomes.',
    },
  ];

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchDynamicMembers = async () => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 10000)
      );

      try {
        const members = await Promise.race([
          teamService.getAll(),
          timeoutPromise
        ]) as DBTeamMember[];

        if (isMounted) {
          setDynamicMembers(members);
        }
      } catch (error) {
        console.error("Error fetching dynamic team members:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDynamicMembers();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const allMembers = [...hardcodedMembers, ...dynamicMembers];

  const stats = [
    { icon: Users, value: "100+", label: "Happy Clients" },
    { icon: Award, value: "6+", label: "Years Experience" },
    { icon: TrendingUp, value: "98%", label: "Success Rate" },
    { icon: Building2, value: "100+", label: "Properties Sold" },
  ];

  return (
    <section id="about" className={`py-20 lg:py-32 bg-background ${headingAsPage ? "pt-32 lg:pt-40" : ""}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-luxury">
              <img
                src={aboutImage}
                alt="Professional Real Estate Consultation"
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>

            <div className="absolute -bottom-6 -right-6 w-72 h-72 gradient-gold opacity-20 rounded-full blur-3xl -z-10" />
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <HeadingTag className="text-4xl md:text-5xl font-bold text-foreground">
                Building Dreams,{" "}
                <span className="text-primary">One Home at a Time</span>
              </HeadingTag>
              <div className="h-1 w-20 gradient-gold" />
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              At Nikas Realty, we help clients find apartments, houses and luxury homes for sale and rent in Nairobi and across Kenya. Our team offers professional advice, customized property solutions, and a seamless buying and renting experience.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-card p-6 rounded-xl shadow-card hover:shadow-luxury transition-smooth"
                  >
                    <Icon className="text-primary w-10 h-10 mb-3" />
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-center mt-20">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-3">Our Story</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">Nikas Realty began with a vision to connect families, investors, and communities to high-quality homes and properties in Kenya. With our founders deeply rooted in real estate, we’ve grown to be a trusted advisor for hundreds of clients, always valuing service and integrity.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary mb-3">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">To simplify and elevate the property experience in Kenya by offering expert advice, transparent processes, and a curated selection of modern, elegant, and luxurious homes for every need.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary mb-3">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">To be Kenya’s most trusted real estate partner, delivering exceptional value, service, and innovation to our clients and communities.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary mb-3">Our Values</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">Integrity, Excellence, Customer Focus, Innovation, and Community.</p>
          </div>
        </div>

        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-foreground mb-8">Meet Our Team</h3>

          <div className="flex flex-wrap gap-8 justify-center items-stretch">
            {allMembers.map((member) => (
              <TeamMember
                key={member.id}
                name={member.name}
                title={member.role}
                image={member.photo || '/placeholder.svg'}
                bio={member.bio || ''}
                objectPosition={member.id?.includes('native-monica') ? "object-top" : "object-center"}
              />
            ))}

            {loading && allMembers.length === hardcodedMembers.length && (
              <div className="w-full flex justify-center items-center py-12">
                <p className="text-muted-foreground animate-pulse">Loading additional team members...</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 max-w-2xl mx-auto">
          <NewsletterSubscribe variant="default" />
        </div>
      </div>
    </section>
  );
};

const TeamMember = ({ name, title, image, bio, objectPosition = "object-center" }: { name: string; title: string; image: string; bio: string; objectPosition?: string }) => (
  <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-sm flex flex-col items-center text-center gap-3 h-full">
    <img
      src={image}
      alt={name}
      className={`w-24 h-24 object-cover ${objectPosition} rounded-full border-4 border-primary shadow-md mb-2`}
      loading="lazy"
    />
    <div className="text-xl font-semibold text-foreground">{name}</div>
    <div className="text-primary font-medium">{title}</div>
    <div className="text-muted-foreground text-sm">{bio}</div>
  </div>
);

export default About;
