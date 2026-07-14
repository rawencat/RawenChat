"use client";

import React, { useMemo } from "react";
import * as Babel from "@babel/standalone";

type CompiledComponent = React.ComponentType<Record<string, unknown>>;

export class MessageErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode; resetKey: string }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error de render en componente custom:", error, info);
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-red-500 p-4 text-sm">
          Error al renderizar: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export const DEFAULT_COMPONENT_CODE = `({ msg, ShowTime = true }) => (
  <div className="animate-message-in px-1 py-1">
    <div className="message-container flex gap-3 px-3 py-2.5 rounded-[10px] bg-[rgba(10,10,14,0.55)] backdrop-blur-sm shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <div
        className="w-[3px] rounded-full shrink-0 self-stretch"
        style={{ backgroundColor: msg.color || "#ff9d6c" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="username font-medium text-[13.5px] tracking-[-0.01em]"
            style={{ color: msg.color || "#ff9d6c" }}
          >
            {msg.username}
          </span>
          {ShowTime && (
            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.32)] tabular-nums ml-auto shrink-0">
              {new Date(msg.timestamp).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <p className="message-text text-[14px] text-[rgba(255,255,255,0.92)] leading-snug wrap-break-word mt-0.5">
          {msg.message}
        </p>
      </div>
    </div>
  </div>
)`;


function stripSpacesInBrackets(code: string): string {
  return code.replace(/\[([^\]]+)\]/g, (match) => match.replace(/\s+/g, ""));
}

function compileJSXComponent(rawCode: string): CompiledComponent {
  const source = stripSpacesInBrackets(rawCode.trim());

  const transpiled = Babel.transform(source, {
    presets: [["react", { runtime: "classic" }]],
  }).code;

  if (!transpiled) {
    throw new Error("Transpilación fallida");
  }

  const body = transpiled.trim().replace(/;$/, "");
  return new Function("React", `return ${body}`)(React);
}

export function useCustomMessageComponent(rawCode: string | null | undefined) {
  return useMemo(() => {
    const userCode = (rawCode ?? "").trim();

    let Inner: CompiledComponent;
    let resetKey: string;

    try {
      Inner = compileJSXComponent(userCode || DEFAULT_COMPONENT_CODE);
      resetKey = userCode || DEFAULT_COMPONENT_CODE;
    } catch (e) {
      console.error("Error compiling custom component, using default:", e);
      try {
        Inner = compileJSXComponent(DEFAULT_COMPONENT_CODE);
        resetKey = DEFAULT_COMPONENT_CODE;
      } catch {
        const message = (e as Error).message;
        return function CompileErrorFallback() {
          return (
            <div className="text-red-500 p-4 text-sm">
              Error en el código: {message}
            </div>
          );
        };
      }
    }

    return function CustomMessageComponent(props: Record<string, unknown>) {
      return (
        <div className="tailwind-root">
          <MessageErrorBoundary resetKey={resetKey}>
            <Inner {...props} />
          </MessageErrorBoundary>
        </div>
      );
    };
  }, [rawCode]);
}