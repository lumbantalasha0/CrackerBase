import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  success?: boolean;
  clarification?: boolean;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your BEMACHO AI Assistant. I can help you quickly record sales, expenses, and inventory movements. Just tell me what happened in plain language!\n\nTry saying things like:\n• 'Sold 15 packs for K30 each to John'\n• 'Bought flour for K350'\n• 'Produced 200 packs today'\n• 'Electricity bill K650'",
      success: true
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage.content
      });
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "I processed your request.",
        success: data.success,
        clarification: data.clarification
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If successful database operation, invalidate queries to refresh UI
      if (data.success && !data.clarification) {
        queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
        queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/analytics/recent-activity'] });
        
        toast({
          title: "Success!",
          description: data.message,
          variant: "default"
        });
      }

    } catch (error) {
      console.error("AI chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again or enter the data manually.",
        success: false
      }]);

      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-amber-600 to-primary bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Enter your daily activities in plain language - I'll handle the data entry
        </p>
      </div>

      <Card className="glass-heavy shadow-2xl border-primary/20">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat with BEMACHO AI
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages Container */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : message.success === false
                      ? "glass-light border border-destructive/30 shadow-sm"
                      : "glass-light border border-border/30 shadow-sm"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      {message.success === true && !message.clarification && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                      )}
                      {message.success === false && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      {message.clarification && (
                        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {message.clarification ? "Question" : message.success ? "Recorded" : "AI"}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="glass-light border border-border/30 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (e.g., 'Sold 10 packs for K25 each')"
                className="flex-1"
                disabled={isLoading}
                data-testid="input-ai-message"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shadow-md hover:shadow-lg"
                data-testid="button-send-ai-message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pro tip: Press Enter to send, or describe multiple actions separated by periods
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Examples */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          "Sold 15 packs for K30 each to John",
          "Made 25kg flour crackers",
          "Produced 200 packs today",
          "Electricity bill K650"
        ].map((example, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => setInput(example)}
            className="justify-start text-left h-auto py-2 px-3 glass-light hover:shadow-md"
            disabled={isLoading}
            data-testid={`button-example-${idx}`}
          >
            <span className="text-xs">{example}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
