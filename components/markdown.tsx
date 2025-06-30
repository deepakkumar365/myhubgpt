import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChartComponent } from "./chart/chart";

const NonMemoizedMarkdown = ({ children }: { children: string}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');

      // Handle chart code blocks
      if (match && match[1].includes('chart')) {
        if (!isClient) {
          return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
        }

        try {
          // Try to clean the input before parsing
          let jsonStr = String(children).trim();

          // Remove any leading/trailing backticks (from markdown code blocks)
          jsonStr = jsonStr.replace(/^```json\s+|^```\s+|```$/g, '');

          // Check if using single quotes instead of double quotes
          if (jsonStr.includes("'") && !jsonStr.includes('"')) {
            // Replace single quotes with double quotes for JSON compatibility
            jsonStr = jsonStr.replace(/'/g, '"');
          }

          // Fix unquoted property names (e.g., {name: "value"} → {"name": "value"})
          jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

          // Remove trailing commas before closing brackets
          jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');

          // Parse the JSON data
          const chartData = JSON.parse(jsonStr);

          // Determine chart type from code block or data
          const chartType = match[1] === 'chart' ? (chartData.type || 'bar') : match[1].replace('chart', '');

          // Extract data and options
          const data = chartData.data || chartData;
          const options = chartData.options || {};

          return (
            <ChartComponent type={chartType} data={data} options={options} width={data.width || 600} height={data.height || 400} />
          );
        } catch (error) {

        }
      }

      // Regular code blocks
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    h1: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-3xl font-bold mb-4" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      return (
        <h2 className="text-2xl font-bold mb-3" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      return (
        <h3 className="text-xl font-semibold mb-2" {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ node, children, ...props }: any) => {
      return (
        <h4 className="text-lg font-semibold mb-2" {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ node, children, ...props }: any) => {
      return (
        <h5 className="text-base font-semibold mb-1" {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ node, children, ...props }: any) => {
      return (
        <h6 className="text-sm font-semibold mb-1" {...props}>
          {children}
        </h6>
      );
    },
    a: ({ node, href, children, ...props }: any) => {
      return (
        <a
          href={href}
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-inside ml-4 [&>li::marker]:text-gray-600" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      );
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-disc list-inside ml-4 [&>li::marker]:text-gray-600" {...props}>
          {children}
        </ul>
      );
    },
    strong: ({ node, children, ...props }: any) => {
      return (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      );
    },
    table: ({ node, children, ...props }: any) => {
      return (
        <div className="overflow-auto rounded-lg w-full max-w-2xl">
          <table className="min-w-full border-collapse text-sm" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead: ({ node, children, ...props }: any) => {
      return (
        <thead className="bg-zinc-100 dark:bg-zinc-800" {...props}>
          {children}
        </thead>
      );
    },
    tbody: ({ node, children, ...props }: any) => {
      return (
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700" {...props}>
          {children}
        </tbody>
      );
    },
    tr: ({ node, children, ...props }: any) => {
      return (
        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900" {...props}>
          {children}
        </tr>
      );
    },
    th: ({ node, children, ...props }: any) => {
      return (
        <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap" {...props}>
          {children}
        </th>
      );
    },
    td: ({ node, children, ...props }: any) => {
      return (
        <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap" {...props}>
          {children}
        </td>
      );
    },

  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
