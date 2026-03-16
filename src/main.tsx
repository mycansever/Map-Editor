import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface RootErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Keep the app shell visible instead of crashing to a blank screen.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#0f0f1a] p-6 text-slate-200">
          <div className="max-w-md rounded border border-slate-700 bg-slate-900 p-4 text-sm">
            <p className="font-semibold text-red-300">Editor crashed unexpectedly</p>
            <p className="mt-2 text-slate-300">Please refresh the page. If this repeats, clear autosave data from browser storage.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
