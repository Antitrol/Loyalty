import React, { useState } from 'react';
import { LayoutDashboard, Receipt } from 'lucide-react';
import { LoyaltyManager } from '../loyalty/LoyaltyManager';
import { ReportingDashboard } from '../loyalty/ReportingDashboard';
import { Button } from '@/components/ui/button';

interface HomePageProps {
  token: string | null;
  storeName?: string;
}

const HomePage: React.FC<HomePageProps> = ({ token, storeName }) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'reporting'>('operations');

  return (
    <div className="max-w-[1200px] mx-auto p-6 bg-background min-h-[100vh]">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to {storeName || 'Demo Store'}</h2>
        <p className="text-muted-foreground mt-2">Loyalty Program Management Dashboard</p>
      </div>

      <div className="flex justify-center mb-8 space-x-4">
        <Button
          variant={activeTab === 'operations' ? 'default' : 'outline'}
          onClick={() => setActiveTab('operations')}
          className="w-40"
        >
          <Receipt className="mr-2 h-4 w-4" />
          Operations
        </Button>
        <Button
          variant={activeTab === 'reporting' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reporting')}
          className="w-40"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Reporting
        </Button>
      </div>

      <div className="flex justify-center">
        {activeTab === 'operations' ? <LoyaltyManager /> : <ReportingDashboard />}
      </div>
    </div>
  );
};

export default HomePage;
