import { Users, MessageSquare, MessagesSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, icon }: MetricCardProps) => (
  <Card className="p-4 glass-chip hover:bg-blue-500/5 transition-all duration-200">
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
        {icon}
      </div>
      <p className="hidden sm:block text-sm font-medium text-slate-600 dark:text-muted-foreground">
        {title}
      </p>
      <h3 className="text-xl font-bold text-foreground">
        {value.toLocaleString()}
      </h3>
    </div>
  </Card>
);

interface MetricsProps {
  users: number;
  conversations: number;
  messages: number;
}

export function Metrics({ users, conversations, messages }: MetricsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-4 col-span-3 h-full">
      <MetricCard
        title={t('analytics.metrics.users', 'Users')}
        value={users}
        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
      />
      <MetricCard
        title={t('analytics.metrics.conversations', 'Conversations')}
        value={conversations}
        icon={<MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
      />
      <MetricCard
        title={t('analytics.metrics.messages', 'Messages')}
        value={messages}
        icon={<MessagesSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
      />
    </div>
  );
}