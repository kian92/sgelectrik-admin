"use client";
import React from "react";
import { type ContentBlock } from "@/components/JsonContentBuilder";

interface BlogContentDisplayProps {
  content: ContentBlock[] | string;
}

export function BlogContentDisplay({ content }: BlogContentDisplayProps) {
  let blocks: ContentBlock[] = [];

  if (typeof content === "string") {
    try {
      let parsed = JSON.parse(content);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      blocks = Array.isArray(parsed) ? parsed : [];
    } catch {
      blocks = [];
    }
  } else if (Array.isArray(content)) {
    blocks = content;
  }

  if (blocks.length === 0) {
    return <div className="text-slate-500 italic">No content available.</div>;
  }

  return (
    <div className="prose prose-sm max-w-none space-y-6">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={idx}
                className="text-2xl font-bold text-slate-900 mt-8 mb-4"
              >
                {block.text}
              </h2>
            );

          case "subheading":
            return (
              <h3
                key={idx}
                className="text-xl font-semibold text-slate-800 mt-6 mb-3"
              >
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <p key={idx} className="text-slate-700 leading-relaxed">
                {block.text}
              </p>
            );

          case "tip":
            return (
              <div
                key={idx}
                className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg"
              >
                <p className="text-sm font-semibold text-emerald-900 mb-1">
                  Pro Tip
                </p>
                <p className="text-sm text-emerald-800">{block.text}</p>
              </div>
            );

          case "list":
            return (
              <ul key={idx} className="space-y-2 pl-6">
                {block.items?.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="text-slate-700 flex items-start gap-3"
                  >
                    <span className="text-emerald-600 font-bold mt-0.5 flex-shrink-0">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div
                key={idx}
                className="overflow-x-auto border border-slate-200 rounded-lg"
              >
                <table className="w-full text-sm">
                  <tbody>
                    {block.rows?.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={
                          rowIdx % 2 === 0 ? "bg-slate-50" : "bg-white"
                        }
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-200 w-1/3">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
