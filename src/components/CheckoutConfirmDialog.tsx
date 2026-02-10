import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, CreditCard } from "lucide-react";

interface CheckoutConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    totalAmount: number;
    itemCount: number;
    isPending: boolean;
}

export function CheckoutConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    totalAmount,
    itemCount,
    isPending,
}: CheckoutConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30">
                        <ShoppingCart className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="font-display text-2xl text-center">Ready to Checkout?</DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        Please review your order before proceeding to payment
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Order Summary */}
                    <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="h-4 w-4" />
                                <span className="text-sm font-medium">Items in cart</span>
                            </div>
                            <span className="font-bold">{itemCount}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                <span className="text-sm font-medium">Total Amount</span>
                            </div>
                            <span className="font-display font-bold text-xl text-primary">
                                ${totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            🎉 Free shipping on all orders!
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Continue Shopping
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 shadow-lg shadow-primary/25"
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></span>
                                Processing...
                            </span>
                        ) : (
                            "Proceed to Payment"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
