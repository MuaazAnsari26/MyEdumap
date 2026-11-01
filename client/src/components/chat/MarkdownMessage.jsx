import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Used specifically for AI-generated content (doubt solver replies,
// teaching insights) where Gemini often responds with markdown formatting
// and LaTeX math ($...$ inline, $$...$$ block). Human-typed chat messages
// deliberately do NOT go through this — rendering a student's or
// teacher's own text as markdown would be surprising, not helpful.
export default function MarkdownMessage({ content }) {
  return (
    <div className="markdown-message">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
