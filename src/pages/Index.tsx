import { useState } from "react";
import Navigation, { TabOption } from "@/components/Navigation";
import Hero from "@/components/Hero";
import EstimatorForm from "@/components/EstimatorForm";
import ListingForm from "@/components/ListingForm";
import ListingList from "@/components/ListingList";
import MessagesApp from "@/components/MessagesApp";
import Features from "@/components/Features";
import CommunitySections from "@/components/CommunitySections";
import Footer from "@/components/Footer";
import FloatingAdvisor from "@/components/FloatingAdvisor";
import { getUserId } from "@/utils/session";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabOption>('buy');
  const userId = getUserId();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 to-white">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab !== 'messages' && <Hero />}

      {/* Main Content Area */}
      <div className="min-h-[600px] animate-in fade-in duration-500">
        {activeTab === 'estimate' && <EstimatorForm />}
        {activeTab === 'buy' && <ListingList onNavigateToMessages={() => setActiveTab('messages')} />}
        {activeTab === 'myListings' && (
          <ListingList ownerId={userId} onNavigateToMessages={() => setActiveTab('messages')} />
        )}
        {activeTab === 'sell' && <ListingForm />}
        {activeTab === 'messages' && <MessagesApp onBack={() => setActiveTab('buy')} />}
      </div>

      {activeTab !== 'messages' && (
        <>
          <Features />
          <CommunitySections />
          <Footer />
        </>
      )}
      <FloatingAdvisor context={{}} />
    </div>
  );
};

export default Index;
