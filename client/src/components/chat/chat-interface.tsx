import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  MessageCircle,
  Lightbulb,
  Wand2,
  Calendar,
  Brain,
  Code,
  BookOpen,
  Plus,
  Briefcase,
  BotMessageSquare,
} from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ChatInput, ChatInputRef } from "./chat-input";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";

function TypingIndicator() {
  return (
    <div className="mb-6 flex justify-start" data-testid="typing-indicator">
      <div className="flex space-x-3 max-w-3xl">
        <div className="w-8 h-8 rounded-full glass-chip flex items-center justify-center flex-shrink-0">
          <BotMessageSquare className="w-4 h-4 text-blue-500" />
        </div>
        <div className="glass-chip rounded-2xl rounded-tl-sm p-4 shadow-lg">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onInsertText }: { onInsertText: (text: string) => void }) {
  const { t } = useTranslation();
  
  const sampleQuestions = t('chat.sampleQuestions', { returnObjects: true }) as string[];
  const suggestionChipsData = t('chat.suggestionChips', { returnObjects: true }) as Array<{ text: string; query: string }>;

  const suggestionChips = [
    { icon: Briefcase, ...suggestionChipsData[0] },
    { icon: Code, ...suggestionChipsData[1] },
    { icon: BookOpen, ...suggestionChipsData[2] },
    { icon: Brain, ...suggestionChipsData[3] },
    { icon: Calendar, ...suggestionChipsData[4] },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16">
      <div className="text-center">
        <h1 className="text-3xl font-light text-foreground mb-8">
          {t('chat.title')}
        </h1>
        <h2 className="text-lg font-normal text-muted-foreground mb-12">
          {t('chat.subtitle')}
        </h2>

        {/* Suggestion Chips */}
        <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-16">
          {suggestionChips.map((chip, index) => {
            const IconComponent = chip.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onInsertText(chip.query)}
                className="glass-chip px-2 sm:px-4 py-2 rounded-xl hover:bg-blue-500/20 transition-all duration-200 group border-0 bg-transparent flex items-center space-x-0 sm:space-x-2"
                data-testid={`chip-${chip.text.toLowerCase()}`}
              >
                <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                <span className="hidden sm:inline-block text-sm text-muted-foreground group-hover:text-blue-400 transition-colors ml-2">
                  {chip.text}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Sample Questions */}
        <div className="space-y-2 max-w-md mx-auto mb-16 text-center">
          {sampleQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => onInsertText(question)}
              className="block w-full text-center px-4 py-3 text-muted-foreground/70 hover:text-foreground transition-colors text-sm rounded-lg hover:bg-white/5"
              data-testid={`button-sample-question-${index}`}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const queryClient = useQueryClient();

  const handleInsertText = (text: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.insertText(text);
    }
  };

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        content,
        isUser: true,
      });
      return response.json();
    },
    onSuccess: (_, content) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });

      // Generate AI response using Pedro's persona
      setIsTyping(true);
      setTimeout(() => {
        sendAssistantResponseMutation.mutate(content);
      }, 1000);
    },
  });

  const sendAssistantResponseMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Call the OpenAI chat completion endpoint
      const response = await apiRequest("POST", "/api/chat/completion", {
        content: userMessage,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const handleNewConversation = async () => {
    try {
      // Clear messages from backend
      await apiRequest("DELETE", "/api/messages");
      // Update the frontend cache
      queryClient.setQueryData(["/api/messages"], []);
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="h-screen flex flex-col bg-gradient-dark relative">
      {/* New Conversation Button - Top Left Corner */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewConversation}
          className="glass-chip hover:bg-blue-500/20 transition-all duration-200 group border-0 bg-transparent"
          data-testid="button-new-conversation"
        >
          <Plus className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:scale-110 transition-all" />
          <span className="sr-only">New conversation</span>
        </Button>
      </div>

      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative overflow-hidden">
        {messages.length === 0 && !isLoading ? (
          /* Welcome Screen - Full screen centered */
          <div className="flex-1 pb-48">
            <WelcomeScreen onInsertText={handleInsertText} />
          </div>
        ) : (
          /* Chat Messages */
          <div
            className="flex-1 p-6 pt-20 overflow-y-auto scroll-smooth hide-scrollbar pb-48"
            data-testid="messages-container"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isTyping && <TypingIndicator />}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        )}
      </main>

      {/* Chat Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <ChatInput
          ref={chatInputRef}
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}
