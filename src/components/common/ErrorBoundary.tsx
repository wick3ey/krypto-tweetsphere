
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows fallback UI
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error information for debugging
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    // Show toast notification
    toast({
      title: "Ett fel uppstod",
      description: "Vi har loggat felet och arbetar på en lösning.",
      variant: "destructive",
    });
    
    // Update state with errorInfo to show more information
    this.setState({
      errorInfo: errorInfo
    });
  }

  // Method to reset error state
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Något gick fel</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Vi ber om ursäkt, men ett fel har uppstått. Försök att ladda om sidan.
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()}>
              Ladda om sidan
            </Button>
            <Button 
              variant="outline" 
              onClick={this.resetError} 
              className="ml-2"
            >
              Försök igen
            </Button>
          </div>
          {this.state.error && (
            <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm overflow-auto max-w-md text-left">
              <p className="font-mono">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs opacity-70">Teknisk information</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-[200px] p-2 bg-muted/80 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
