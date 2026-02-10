import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";

interface CheckoutTransitionDialogProps {
    open: boolean;
}

export function CheckoutTransitionDialog({ open }: CheckoutTransitionDialogProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-sm flexflex-col items-center justify-center text-center p-8 border-none bg-gradient-to-b from-card to-secondary/30 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-md">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-display font-bold text-foreground">Order Placed!</h2>
                        <p className="text-muted-foreground">
                            Please complete your payment details to confirm the order.
                        </p>
                    </div>

                    <div className="h-1 w-24 bg-secondary rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-primary animate-[shimmer_1.5s_infinite] w-full origin-left-right scale-x-50" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
