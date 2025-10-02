import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDropdown } from "@/components/chat/settings-dropdown";
import { Metrics } from "@/components/analytics/metrics";
import { CSATGauge } from "@/components/analytics/charts";

export default function AnalyticsView() {
  const { t } = useTranslation();

  const handleNewConversation = async () => {
    // TODO: Implement new conversation functionality for analytics view
    console.log("New conversation clicked in analytics view");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-dark relative">
      {/* Header Row with New Conversation Button, Title, and Settings Dropdown */}
      <header className="flex items-center justify-between p-4 z-10">
        {/* New Conversation Button - Left */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewConversation}
          className="glass-chip hover:bg-blue-500/20 transition-all duration-200 group border-0 bg-transparent"
          data-testid="button-new-conversation"
          title={t('tooltips.newConversation')}
        >
          <Plus className="h-5 w-5 text-slate-600 dark:text-muted-foreground group-hover:text-blue-400 group-hover:scale-110 transition-all" />
          <span className="sr-only">{t('tooltips.newConversation')}</span>
        </Button>

        {/* Title - Center */}
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          {t('analytics.title', 'Analytics View')}
        </h1>

        {/* Settings Dropdown - Right */}
        <SettingsDropdown />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative overflow-hidden p-6">
        {/* Analytics Dashboard */}
        <div className="w-[85%] mx-auto">
          {/* Metrics and Gauge Row */}
          <div className="grid grid-cols-5 gap-4">
            <Metrics
              users={1234}
              conversations={567}
              messages={8901}
            />
            <div className="col-span-2">
              <CSATGauge value={85} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
