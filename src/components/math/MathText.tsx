"use client";

import katex from "katex";
import { Fragment, useMemo } from "react";

export interface MathBlockProps {
  latex: string;
  className?: string;
}

export function MathBlock({ latex, className = "" }: MathBlockProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        strict: "ignore",
      }),
    [latex]
  );

  return (
    <div
      className={`overflow-x-auto py-1 text-[var(--text-primary)] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export interface MathInlineProps {
  latex: string;
  className?: string;
}

export function MathInline({ latex, className = "" }: MathInlineProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: false,
        throwOnError: false,
        strict: "ignore",
      }),
    [latex]
  );

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface TextToken {
  type: "text" | "inline" | "display";
  value: string;
}

function tokenizeMathProse(input: string): TextToken[] {
  const tokens: TextToken[] = [];
  // Match $$...$$ display math first, then inline $...$ avoiding currency like "$5 and $10"
  const pattern =
    /\$\$([\s\S]+?)\$\$|(?<!\\)\$(?!\s)((?:[^$\n]*?[^\s\\])|[^\s$\\])\$/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: input.slice(lastIndex, match.index).replace(/\\\$/g, "$"),
      });
    }

    if (match[1] !== undefined) {
      tokens.push({ type: "display", value: match[1].trim() });
    } else if (match[2] !== undefined) {
      tokens.push({ type: "inline", value: match[2].trim() });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < input.length) {
    tokens.push({
      type: "text",
      value: input.slice(lastIndex).replace(/\\\$/g, "$"),
    });
  }

  return tokens;
}

export interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Safely renders prose containing inline $...$ and display $$...$$ KaTeX expressions.
 */
export function MathText({ text, className = "" }: MathTextProps) {
  const tokens = useMemo(() => tokenizeMathProse(text), [text]);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
        if (token.type === "display") {
          return <MathBlock key={idx} latex={token.value} className="my-2" />;
        }
        if (token.type === "inline") {
          return <MathInline key={idx} latex={token.value} />;
        }
        return <Fragment key={idx}>{token.value}</Fragment>;
      })}
    </span>
  );
}
