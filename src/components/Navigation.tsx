import { Button } from "@/components/ui/button";
import { Calculator, Store, PlusCircle, UserCog, MessageSquare } from "lucide-react";

export type TabOption = "estimate" | "buy" | "sell" | "myListings" | "messages";

interface NavigationProps {
  activeTab: TabOption;
  onTabChange: (tab: TabOption) => void;
}

const tabs = [
  { id: "estimate", label: "Get Estimate", icon: Calculator },
  { id: "buy", label: "Buy / Rent", icon: Store },
  { id: "sell", label: "Post Listing", icon: PlusCircle },
  { id: "myListings", label: "My Listings", icon: UserCog },
  { id: "messages", label: "My Messages", icon: MessageSquare },
] as const;

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-slate-100 bg-white/70">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => onTabChange("buy")}
          className="text-2xl font-black tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
        >
          Barcelona Home
        </button>
        <div className="hidden md:flex items-center gap-2 bg-slate-100/80 rounded-full px-2 py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <Button className="rounded-full px-6" onClick={() => onTabChange("sell")}>
          List Property
        </Button>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-100 bg-white/90">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 text-sm py-3 flex items-center justify-center gap-2 ${
              activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
