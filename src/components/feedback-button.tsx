import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function FeedbackButton() {
  const { user } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      screen: loc.pathname,
      message: message.trim(),
      rating: rating || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thank you! Your feedback was sent. 🙌");
    setMessage(""); setRating(0); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="fixed bottom-20 md:bottom-6 right-6 z-40 shadow-lg rounded-full h-12 w-12 p-0"
          aria-label="Send feedback"
        >
          <MessageCircle className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Sending feedback about: <span className="font-mono">{loc.pathname}</span></p>
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                  <Star className={`size-6 transition-colors ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Your message</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's on your mind…" maxLength={1000} />
          </div>
          <Button onClick={submit} disabled={submitting || !message.trim()} className="w-full">
            {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
