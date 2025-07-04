
import { useState, useEffect, useRef } from "react";
import chatService from "@/services/chatService";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    const connect = () => {
      chatService.connect({
        onMessage: (message) => {
          setMessages((prev) => [...prev, message]);
        },
        onError: (error) => {
          console.error("WebSocket error:", error);
          setConnectionError("Failed to connect to chat service. Please try again later.");
          setIsConnected(false);
        },
        onOpen: () => {
          setIsConnected(true);
          setConnectionError(null);
          // Add welcome message
          const welcomeMessage: Message = {
            id: crypto.randomUUID(),
            sender: 'bot',
            text: "Hello! I'm your academic assistant. How can I help you today?",
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        },
        onClose: () => {
          setIsConnected(false);
        }
      });
    };
    
    connect();
    
    // Cleanup on unmount
    return () => {
      chatService.disconnect();
    };
  }, []);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;
    
    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };
    
    // Add to messages
    setMessages((prev) => [...prev, userMessage]);
    
    // Send via WebSocket
    chatService.sendMessage(inputMessage);
    
    // Clear input
    setInputMessage("");
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Bot Avatar" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">Academic Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {isConnected ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-red-500">Offline</span>
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {connectionError && (
        <div className="p-3 bg-red-50 text-red-500 text-sm">
          {connectionError}
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {!isConnected && messages.length === 0 && !connectionError && (
            <div className="flex justify-center items-center h-96">
              <div className="text-center text-muted-foreground">
                <p>Connecting to chat service...</p>
                <div className="mt-2 animate-pulse flex space-x-1 justify-center">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <CardContent className="p-3 border-t">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-10 resize-none"
            disabled={!isConnected}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!isConnected || !inputMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
