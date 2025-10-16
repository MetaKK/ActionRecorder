/**
 * Markdown渲染组件
 * 参考ChatGPT的最佳实践，支持完整的Markdown语法
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-body prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,        // GitHub Flavored Markdown (表格、删除线、任务列表等)
          remarkMath,       // 数学公式支持
          remarkBreaks,     // 软换行支持
        ]}
        rehypePlugins={[
          rehypeKatex,      // LaTeX数学公式渲染
          rehypeHighlight,  // 代码高亮
        ]}
        components={{
          // 段落
          p: ({ children }) => (
            <p className="mb-4 last:mb-0 leading-7 text-[15px]">
              {children}
            </p>
          ),
          
          // 标题
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 text-xl font-bold tracking-tight border-b border-border/20 pb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-5 text-lg font-semibold tracking-tight first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-base font-semibold first:mt-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="mb-2 mt-3 text-sm font-semibold first:mt-0">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="mb-2 mt-3 text-sm font-medium text-muted-foreground first:mt-0">
              {children}
            </h6>
          ),

          // 分割线
          hr: () => (
            <hr className="my-6 border-border/30" />
          ),

          // 列表
          ul: ({ children }) => (
            <ul className="mb-4 space-y-2 list-disc list-outside ml-6 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 space-y-2 list-decimal list-outside ml-6 marker:text-muted-foreground marker:font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-7 pl-1">
              {children}
            </li>
          ),

          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-primary/30 bg-muted/50 pl-4 pr-4 py-3 italic rounded-r-lg">
              {children}
            </blockquote>
          ),

          // 代码
          code: ({ inline, className, children, ...props }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <div className="my-4 overflow-hidden rounded-lg border border-border/20 bg-muted/50">
                  {/* 代码块头部 */}
                  <div className="flex items-center justify-between border-b border-border/20 bg-muted px-4 py-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      复制代码
                    </button>
                  </div>
                  {/* 代码内容 */}
                  <div className="overflow-x-auto">
                    <code className={cn("hljs language-" + language, className)} {...props}>
                      {children}
                    </code>
                  </div>
                </div>
              );
            }

            // 行内代码
            return (
              <code 
                className="relative rounded bg-muted px-[0.4em] py-[0.2em] font-mono text-[0.9em] font-medium border border-border/20"
                {...props}
              >
                {children}
              </code>
            );
          },

          // 预格式化文本
          pre: ({ children }) => (
            <pre className="overflow-x-auto">
              {children}
            </pre>
          ),

          // 表格
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border/20">
              <table className="w-full border-collapse bg-background">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border/20">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/10">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm">
              {children}
            </td>
          ),

          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 underline-offset-2 transition-colors font-medium inline-flex items-center gap-1"
            >
              {children}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none" 
                className="inline-block opacity-70"
              >
                <path 
                  d="M3.5 3C3.22386 3 3 3.22386 3 3.5C3 3.77614 3.22386 4 3.5 4V3ZM8.5 3.5H9C9 3.22386 8.77614 3 8.5 3V3.5ZM8 8.5C8 8.77614 8.22386 9 8.5 9C8.77614 9 9 8.77614 9 8.5H8ZM2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L2.64645 8.64645ZM3.5 4H8.5V3H3.5V4ZM8 3.5V8.5H9V3.5H8ZM8.14645 3.14645L2.64645 8.64645L3.35355 9.35355L8.85355 3.85355L8.14645 3.14645Z" 
                  fill="currentColor"
                />
              </svg>
            </a>
          ),

          // 图片
          img: ({ src, alt }) => (
            <div className="my-4 overflow-hidden rounded-lg border border-border/20">
              <img
                src={src}
                alt={alt || ''}
                className="w-full object-contain bg-muted/20"
                loading="lazy"
              />
              {alt && (
                <div className="border-t border-border/20 bg-muted/30 px-3 py-2 text-xs text-muted-foreground text-center">
                  {alt}
                </div>
              )}
            </div>
          ),

          // 强调
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">
              {children}
            </em>
          ),
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">
              {children}
            </del>
          ),

          // 任务列表
          input: ({ type, checked, disabled }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  className="mr-2 h-4 w-4 rounded border-border/30 text-primary focus:ring-primary/30 cursor-pointer"
                  readOnly
                />
              );
            }
            return null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

