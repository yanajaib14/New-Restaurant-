import { Component, ErrorInfo, ReactNode } from "react";
import { T } from "../types";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface MyState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, MyState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MyState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.componentName || "component"}:`, error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: 24,
          margin: 16,
          background: T.redLight,
          border: `1px solid ${T.redBorder}`,
          borderRadius: 12,
          textAlign: "center",
        }}>
          <AlertTriangle size={40} color={T.red} style={{ marginBottom: 12 }} />
          <h3 style={{
            fontFamily: "'Segoe UI', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: T.red,
            margin: "0 0 8px"
          }}>
            Something went wrong
          </h3>
          <p style={{
            fontFamily: "'Segoe UI', sans-serif",
            fontSize: 14,
            color: T.muted,
            margin: "0 0 16px"
          }}>
            {this.props.componentName ? `The ${this.props.componentName} section encountered an error.` : "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: T.red,
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}