import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50/50 backdrop-blur-sm dark:bg-red-950/20 dark:border-red-900/50 p-6 my-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg font-bold">Algo deu errado nesta seção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              Ocorreu um erro ao carregar ou renderizar este componente.
              {this.state.error && (
                <code className="block mt-2 p-2 bg-red-100 dark:bg-red-950/60 rounded text-xs overflow-auto max-h-32 font-mono">
                  {this.state.error.message}
                </code>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
