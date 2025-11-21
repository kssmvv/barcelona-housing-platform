import { Building2 } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative pt-12 pb-20 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/30 blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">Barcelona Home</h2>

          <div className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Barcelona's Trusted Property Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Know Your Property's
            <span className="block text-blue-600 mt-2">
              True Value
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Get accurate price estimates for Barcelona apartments using advanced AI. 
            Whether you're renting or selling, make informed decisions with our data-driven evaluations.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
