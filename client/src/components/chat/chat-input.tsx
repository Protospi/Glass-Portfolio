import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { ArrowUp, Mic, Square } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingDuration = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: recordingDuration
        });
        
        // Only send if recording is longer than 500ms and has data
        if (recordingDuration > 500 && audioBlob.size > 0) {
          await sendAudioToServer(audioBlob);
        } else {
          console.log('Recording too short or empty, not sending');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        recordingStartTimeRef.current = null;
      };

      mediaRecorder.start(100); // Record in 100ms chunks
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();

      // Set 30-second timeout
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      console.log('Sending audio to server:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type
      });

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      
      // Since the server already saved both messages, we need to trigger
      // a refresh of the chat interface without going through the normal flow
      // We'll use a custom event or callback to notify the parent component
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('audioTranscriptionComplete', {
          detail: { transcribedText: data.transcribedText }
        }));
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
                  disabled={isLoading || isTranscribing}
                  className={`hover:bg-blue-500/20 transition-all duration-200 group bg-transparent border-0 p-2 rounded-xl ${
                    isRecording ? 'bg-red-500/20' : ''
                  }`}
                  data-testid="button-mic"
                >
                  {isTranscribing ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
                  ) : (
                    <Mic className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                  )}
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
