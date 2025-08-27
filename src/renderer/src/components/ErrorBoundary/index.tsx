import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Aggiorna lo stato così che il prossimo render mostri la UI di fallback.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Puoi anche loggare l'errore in un servizio di reporting
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Puoi renderizzare qualsiasi UI di fallback
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          margin: '20px',
          fontFamily: 'sans-serif'
        }}>
          <h1>Oops! Qualcosa è andato storto.</h1>
          <p>Ci scusiamo per l'inconveniente. Riprova più tardi.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
