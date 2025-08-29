import React, { useRef, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  X,
  Trash2,
  Brain,
  Sparkles,
  Target
} from 'lucide-react';
import './ChatSidebar.css'; // Add the CSS import here
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { MindMapNode } from '../mindmap/MindMapCanvas';
import { AppContext, ChatMessage as ChatMessageType } from '../../context/AppContext'; // Import ChatMessage type from AppContext

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedNodes?: MindMapNode[];
  className?: string;
  messages: ChatMessageType[]; // Added messages prop
  isThinking: boolean; // Added isThinking prop
  onSendMessage: (message: string) => void; // Added onSendMessage prop
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  isOpen, 
  onToggle, 
  selectedNodes = [],
  className,
  messages, // Destructure messages prop
  isThinking, // Destructure isThinking prop
  onSendMessage // Destructure onSendMessage prop
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { models, selectedModel, setSelectedModel } = useContext(AppContext); // Get models, selectedModel, and setSelectedModel from AppContext

  // Auto scroll to bottom quando arriva un nuovo messaggio
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const clearChat = () => {
    // This should ideally clear messages in AppContext, not locally
    // For now, we'll just reset the local state if it were still here.
    // In a fully integrated system, this would trigger a context action.
    console.log("Clear chat functionality needs to be implemented in AppContext.");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="chat-sidebar-overlay"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${isOpen ? 'open' : ''} ${className}`}>
        {/* Header */}
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-header-left">
            <div className="chat-sidebar-header-icon-wrapper">
              <Brain className="chat-sidebar-header-icon" />
            </div>
            <div>
              <h2 className="chat-sidebar-header-title">Life Coach AI</h2>
              <p className="chat-sidebar-header-subtitle">La tua guida personale</p>
            </div>
          </div>

          <div className="chat-sidebar-header-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="chat-sidebar-header-button"
            >
              <Trash2 className="chat-sidebar-header-button-icon" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="chat-sidebar-header-button mobile-only"
            >
              <X className="chat-sidebar-header-button-icon" />
            </Button>
          </div>
        </div>

        {/* Selected nodes indicator */}
        {selectedNodes.length > 0 && (
          <div className="chat-sidebar-selected-nodes">
            <div className="chat-sidebar-selected-nodes-content">
              <Target className="chat-sidebar-selected-nodes-icon" />
              <span>Analizzando: {selectedNodes.map(n => n.data.label).join(', ')}</span>
            </div>
          </div>
        )}

        {/* Model selection */}
        <div className="p-4">
          <label htmlFor="model-select" className="text-sm font-medium text-sidebar-foreground/80">Modello AI</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="mt-1 w-full chat-sidebar-model-select"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chat area */}
        <ScrollArea ref={scrollAreaRef} className="chat-sidebar-scroll-area">
          <div className="chat-sidebar-messages-container">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {isThinking && (
              <div className="chat-sidebar-loading-message">
                <div className="chat-sidebar-loading-avatar">
                  <Brain className="chat-sidebar-loading-avatar-icon" />
                </div>
                <div className="chat-sidebar-loading-bubble">
                  <div className="chat-sidebar-loading-bubble-content">
                    <Sparkles className="chat-sidebar-loading-sparkles-icon" />
                    <span className="chat-sidebar-loading-text">Sto riflettendo...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        

        {/* Input area */}
        <ChatInput 
          onSendMessage={onSendMessage}
          isLoading={isThinking}
          placeholder="Condividi i tuoi pensieri..."
        />
      </div>

      {/* Toggle button when closed */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="chat-sidebar-toggle-button"
        >
          <MessageCircle className="chat-sidebar-toggle-button-icon" />
        </Button>
      )}
    </>
  );
};

export default ChatSidebar;