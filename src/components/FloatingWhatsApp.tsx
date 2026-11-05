import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const FloatingWhatsApp = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello, I'm interested in a property I saw on the Nikas Realty website.");
    window.open(`https://wa.me/254710132320?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`fixed bottom-8 right-8 z-50 transition-smooth ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      }`}
    >
      <div className="relative group">
        {/* Pulse animation */}
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
        
        {/* Button */}
        <div className="relative bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-luxury hover:bg-green-600 hover:scale-110 transition-smooth">
          <MessageCircle size={28} />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-secondary text-white rounded-lg shadow-luxury opacity-0 group-hover:opacity-100 transition-smooth whitespace-nowrap pointer-events-none">
          Chat with us on WhatsApp
          <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-secondary" />
        </div>
      </div>
    </button>
  );
};

export default FloatingWhatsApp;
