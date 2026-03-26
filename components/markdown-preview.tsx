'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prose } from './prose'
import 'katex/dist/katex.min.css'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <Prose className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks
          code({ node, className, children, ...props }) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          // Links
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            )
          },
          // Images
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt}
                className="rounded-lg border border-border max-w-full"
                loading="lazy"
                {...props}
              />
            )
          },
        }}
      >
        {content || '*Start typing to see preview...*'}
      </ReactMarkdown>
    </Prose>
  )
}
