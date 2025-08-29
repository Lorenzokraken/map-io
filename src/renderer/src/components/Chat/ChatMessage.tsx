import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import './ChatMessage.css'; // Import the new CSS file
import { ChatMessage as ChatMessageType } from '../../context/AppContext'; // Import ChatMessage type from AppContext

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, className }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message-container ${isUser ? 'user' : 'ai'} ${className || ''}`}>
      {/* Avatar */}
      <Avatar className={`chat-message-avatar ${isUser ? 'user' : 'ai'}`}>
        <AvatarFallback className={`chat-message-avatar-fallback ${isUser ? 'user' : 'ai'}`}>
          {isUser ? <User className="chat-message-avatar-icon" /> : <Bot className="chat-message-avatar-icon" />}
        </AvatarFallback>
      </Avatar>

      {/* Message bubble */}
      <div className={`chat-message-bubble ${isUser ? 'user' : 'ai'}`}>
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Personalizza i componenti markdown se necessario
              p: ({ children, ...props }) => (
                <p className="markdown-paragraph" {...props}>{children}</p>
              ),
              ul: ({ children, ...props }) => (
                <ul className="markdown-list-ul" {...props}>{children}</ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="markdown-list-ol" {...props}>{children}</ol>
              ),
              li: ({ children, ...props }) => (
                <li className="markdown-list-item" {...props}>{children}</li>
              ),
              code: ({ children, className, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code
                      className="markdown-inline-code"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children, ...props }) => (
                <pre className="markdown-pre-block" {...props}>
                  {children}
                </pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        {/* Removed timestamp as it's not part of the ChatMessage interface in AppContext */}
      </div>
    </div>
  );
};

export default ChatMessage;