import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { ArrowUp, Mic, LucideArrowBigUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export interface ChatInputRef {
  insertText: (text: string) => void;
  focus: () => void;
}


export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ onSendMessage, isLoading }, ref) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      setMessage(text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMicClick = () => {
    // Future implementation for audio recording
    console.log("Mic button clicked - audio recording not implemented yet");
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-input rounded-3xl p-4">
          {/* Main input area */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="min-h-[80px] flex items-start">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  placeholder={t('input.placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full min-h-[50px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground text-base leading-relaxed"
                  disabled={isLoading}
                  data-testid="input-message"
                  rows={1}
                  style={{ 
                    height: 'auto',
                    overflowY: 'hidden'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
            </div>
            
            {/* Bottom toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  onClick={handleMicClick}
                  className="hover:bg-blue-500/20 transition-all duration-200 group bg-transparent border-0 p-2 rounded-xl"
                  data-testid="button-mic"
                >
                  <Mic className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="hover:bg-blue-500/20 transition-all duration-200 group bg-transparent border-0 p-2 rounded-xl"
                data-testid="button-send"
              >
                <ArrowUp className="w-6 h-6 text-gray-700 dark:text-muted-foreground group-hover:scale-110 transition-transform" style={{width: '20px', height: '20px'}} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
