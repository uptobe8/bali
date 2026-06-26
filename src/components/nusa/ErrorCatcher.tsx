'use client'
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorCatcher extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return this.props.fallback || (
        <div style={{ padding: 40, background: '#1a1a2e', color: '#fff', fontFamily: 'monospace', fontSize: 13, overflow: 'auto', maxHeight: '100vh' }}>
          <h2 style={{ color: '#ff4b2f' }}>Client Error:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#aaa', marginTop: 12 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}