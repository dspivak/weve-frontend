"use client";

import { useToast, type Toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export function Toaster() {
    const { toasts } = useToast();

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}

function ToastItem({ toast }: { toast: Toast }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const icons = {
        success: <CheckCircle2 className="size-4 text-emerald-500" />,
        error: <AlertCircle className="size-4 text-destructive" />,
        info: <Info className="size-4 text-blue-500" />,
    };

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-card/80 px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-500 ease-out",
                isVisible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
            )}
        >
            {icons[toast.type]}
            <p className="text-sm font-medium text-foreground">{toast.message}</p>
        </div>
    );
}
