import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDropdown } from "@/components/chat/settings-dropdown";

export default function ServerView() {
  const { t } = useTranslation();

  const handleNewConversation = async () => {
    // TODO: Implement new conversation functionality for server view
    console.log("New conversation clicked in server view");
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
          <Server className="h-5 w-5 text-blue-500" />
          {t('server.title', 'Server View')}
        </h1>

        {/* Settings Dropdown - Right */}
        <SettingsDropdown />
      </header>

      {/* Main Content Area - Empty for now */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full glass-chip flex items-center justify-center mx-auto mb-4">
              <Server className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-lg font-normal text-slate-600 dark:text-muted-foreground mb-2">
              {t('server.emptyState.title', 'Server View')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-muted-foreground">
              {t('server.emptyState.description', 'This area will be populated with server information soon.')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
