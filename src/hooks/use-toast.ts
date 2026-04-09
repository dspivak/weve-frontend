import { useState, useCallback, useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

let subscribers: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifySubscribers() {
    subscribers.forEach((subscriber) => subscriber([...toasts]));
}

export const toast = (message: string, type: ToastType = "success", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };
    toasts = [...toasts, newToast];
    notifySubscribers();

    setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        notifySubscribers();
    }, duration);
};

export function useToast() {
    const [activeToasts, setActiveToasts] = useState<Toast[]>(toasts);

    useEffect(() => {
        const subscriber = (newToasts: Toast[]) => {
            setActiveToasts(newToasts);
        };
        subscribers.push(subscriber);
        return () => {
            subscribers = subscribers.filter((s) => s !== subscriber);
        };
    }, []);

    return { toasts: activeToasts };
}
