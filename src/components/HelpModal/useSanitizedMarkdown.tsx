/**
 * DOMPurify と ReactMarkdown を使用した安全な Markdown レンダリング
 */

import DOMPurify from "dompurify";
import type React from "react";
import ReactMarkdown from "react-markdown";

export function useSanitizedMarkdown() {
  const renderMarkdown = (content: string): React.ReactElement => {
    // ReactMarkdown is safe by default, but we sanitize user content as extra precaution
    const sanitized = DOMPurify.sanitize(content);
    return (
      <div className="markdown-content">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-white mb-4 pb-2 border-b-2 border-neon-purple/30">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-neon-purple mt-6 mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold text-neon-purple mt-4 mb-2">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold text-white mt-3 mb-2">{children}</h4>
            ),
            p: ({ children }) => <p className="text-space-200 mb-4 leading-relaxed">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-space-200 mb-4 space-y-2 ml-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-space-200 mb-4 space-y-2 ml-4">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-space-200">{children}</li>,
            code: ({ children }) => (
              <code className="bg-dark-700/50 text-neon-cyan px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-dark-700/50 text-space-100 p-4 rounded-lg overflow-x-auto mb-4 border border-dark-600">
                {children}
              </pre>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:text-neon-purple underline transition-colors"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-neon-purple/50 pl-4 italic text-space-300 my-4">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-t-2 border-dark-600 my-6" />,
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-space-200 border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-dark-700/50 border-b-2 border-neon-purple/30">{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr className="border-b border-dark-600">{children}</tr>,
            th: ({ children }) => (
              <th className="text-left p-3 font-semibold text-neon-purple">{children}</th>
            ),
            td: ({ children }) => <td className="p-3">{children}</td>,
            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
            em: ({ children }) => <em className="italic text-space-100">{children}</em>,
          }}
        >
          {sanitized}
        </ReactMarkdown>
      </div>
    );
  };

  return { renderMarkdown };
}
