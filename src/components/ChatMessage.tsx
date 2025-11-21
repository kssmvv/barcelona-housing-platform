import { cn } from "@/lib/utils";

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
      // Check for bold text marked with **text**
      const boldParts = line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-inherit">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (numberedMatch) {
        const [, number, contentStr] = numberedMatch;
        // Process bolding inside list item
        const contentParts = contentStr.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-semibold text-inherit">{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        formatted.push(
          <div key={idx} className="flex gap-2 mb-2 items-start">
            <span className="font-bold text-inherit opacity-70 min-w-[1.5em]">{number}.</span>
            <span className="leading-relaxed">{contentParts}</span>
          </div>
        );
      } else if (line.trim()) {
        formatted.push(
          <div key={idx} className="mb-1.5 leading-relaxed last:mb-0">
            {boldParts}
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
    <div className={cn("text-sm", className)}>
      {formatMessage(content)}
    </div>
  );
};

export default ChatMessage;
