interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  className?: string;
}

const ChatMessage = ({ content, role, className = "" }: ChatMessageProps) => {
  // Parse numbered lists and emphasis
  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    const formatted: JSX.Element[] = [];
    
    lines.forEach((line, idx) => {
      // Check if line is a numbered item (e.g., "1. Something", "2. Something")
      const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
      
      if (numberedMatch) {
        const [, number, content] = numberedMatch;
        formatted.push(
          <div key={idx} className="mb-2">
            <span className="font-bold">{number}.</span> {content}
          </div>
        );
      } else if (line.trim()) {
        formatted.push(
          <div key={idx} className="mb-1">
            {line}
          </div>
        );
      } else {
        // Empty line - add spacing
        formatted.push(<div key={idx} className="h-2" />);
      }
    });
    
    return formatted;
  };

  return (
    <div className={className}>
      {formatMessage(content)}
    </div>
  );
};

export default ChatMessage;

