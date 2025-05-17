
"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center">
      <h2 className="text-3xl font-bold text-destructive mb-4">Algo deu errado!</h2>
      <p className="text-muted-foreground mb-6">
        Pedimos desculpas pelo inconveniente. Por favor, tente novamente.
      </p>
      <p className="text-sm text-muted-foreground mb-6">Detalhes do erro: {error.message}</p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Tentar Novamente
      </Button>
    </div>
  );
}
