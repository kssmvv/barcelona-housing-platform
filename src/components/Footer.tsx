import { Home, Mail, MapPin, Phone } from "lucide-react";
import { getUserId } from "@/utils/session";
import { useState, useEffect } from "react";

const Footer = () => {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Barcelona Home</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted partner for property valuation and Barcelona real estate guidance.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#estimator" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Price Estimator
                </a>
              </li>
              <li>
                <a href="#forum" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Community Forum
                </a>
              </li>
              <li>
                <a href="#advice" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Expert Advice
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Barcelona, Spain</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>info@barcelonahome.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>+34 123 456 789</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Barcelona Home. All rights reserved.</p>
          <p className="text-xs mt-2 text-blue-500 font-semibold">v4.0 - Auctions & Favorites</p>
          <p className="text-xs text-slate-400 mt-1">User ID: {userId}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
