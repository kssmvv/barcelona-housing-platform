import { useState } from "react";
import { Send, Bot, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface FloatingChatProps {
    context: any; // Property details
}

const FloatingChat = ({ context }: FloatingChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("https://jqcs7rfwkbj3nl5y7izyrybxim0blcds.lambda-url.us-east-1.on.aws/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: input,
                    context: context
                })
            });
            
            const data = await response.json();
            // The backend now returns the error in data.answer if it fails
            const aiMsg = { role: 'assistant' as const, content: data.answer || "I couldn't get an answer." };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[350px] md:w-[400px]"
                    >
                        <Card className="shadow-2xl border-slate-200 h-[500px] flex flex-col bg-white">
                            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex flex-row items-center justify-between space-y-0 p-4">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                                    <Bot className="w-5 h-5 text-blue-600" />
                                    AI Real Estate Advisor
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4 text-slate-500" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-4 overflow-hidden">
                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-4">
                                        {messages.length === 0 && (
                                            <div className="text-center text-slate-500 text-sm py-8 px-4">
                                                <p className="mb-2">👋 Hi there!</p>
                                                <p>I can help you understand the market or analyze this property.</p>
                                            </div>
                                        )}
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                                    msg.role === 'user' 
                                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                         {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-none px-4 py-2 text-xs italic flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    <Input 
                                        placeholder="Ask a question..." 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                                    />
                                    <Button size="icon" onClick={handleSend} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
                </Button>
            </motion.div>
        </div>
    );
};

export default FloatingChat;

