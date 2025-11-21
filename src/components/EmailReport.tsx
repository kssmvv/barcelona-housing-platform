import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EmailReportProps {
    estimate: number;
    details: any;
}

const EmailReport = ({ estimate, details }: EmailReportProps) => {
    const [email, setEmail] = useState("");
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!email) return;
        setSending(true);
        try {
            const res = await fetch("https://is2yxaltwah5uwvf7ulvptbp4q0zgkgc.lambda-url.us-east-1.on.aws/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    estimate,
                    details
                })
            });
            if (res.ok) {
                toast.success("Report sent!");
                setOpen(false);
            } else {
                throw new Error("Failed");
            }
        } catch (e) {
            toast.error("Could not send email.");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email Report
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Get Your Valuation Report</DialogTitle>
                    <DialogDescription>
                        We'll send a detailed summary to your inbox.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Input 
                        placeholder="name@example.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={handleSend} disabled={sending}>
                        {sending ? "Sending..." : "Send Report"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmailReport;

