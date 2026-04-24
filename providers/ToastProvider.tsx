"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { Toaster, toast } from "sonner";

interface ToastContextValue {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const success = useCallback((title: string, description?: string) => {
    toast.success(title, { description });
  }, []);

  const error = useCallback((title: string, description?: string) => {
    toast.error(title, { description });
  }, []);

  const info = useCallback((title: string, description?: string) => {
    toast.info(title, { description });
  }, []);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <Toaster position="top-center" richColors />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
