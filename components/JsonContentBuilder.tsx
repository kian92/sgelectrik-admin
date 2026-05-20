"use client";
import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export type ContentBlockType =
  | "paragraph"
  | "heading"
  | "subheading"
  | "tip"
  | "table"
  | "list";

export interface ContentBlock {
  type: ContentBlockType;
  text?: string;
  rows?: Array<{ label: string; value: string }>;
  items?: string[];
}

interface JsonContentBuilderProps {
  value: ContentBlock[] | string;
  onChange: (value: ContentBlock[]) => void;
}

const BLOCK_TYPES: { value: ContentBlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "subheading", label: "Subheading" },
  { value: "tip", label: "Tip/Note" },
  { value: "table", label: "Table" },
  { value: "list", label: "Bullet List" },
];

export function JsonContentBuilder({
  value,
  onChange,
}: JsonContentBuilderProps) {
  let blocks: ContentBlock[] = [];

  // Parse input - handle string, double-stringified, or array
  if (typeof value === "string") {
    try {
      let parsed = JSON.parse(value);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      blocks = Array.isArray(parsed) ? parsed : [];
    } catch {
      blocks = [];
    }
  } else if (Array.isArray(value)) {
    blocks = value;
  }

  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  function addBlock(type: ContentBlockType = "paragraph") {
    const newBlocks = [...blocks];
    if (type === "table") {
      newBlocks.push({
        type: "table",
        rows: [{ label: "Column 1", value: "Value 1" }],
      });
    } else if (type === "list") {
      newBlocks.push({ type: "list", items: ["Item 1"] });
    } else {
      newBlocks.push({ type, text: "" });
    }
    onChange(newBlocks);
  }

  function updateBlock(idx: number, block: ContentBlock) {
    const newBlocks = [...blocks];
    newBlocks[idx] = block;
    onChange(newBlocks);
  }

  function deleteBlock(idx: number) {
    onChange(blocks.filter((_, i) => i !== idx));
  }

  function moveBlock(idx: number, direction: "up" | "down") {
    const newBlocks = [...blocks];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    onChange(newBlocks);
  }

  function addTableRow(idx: number) {
    const block = blocks[idx];
    if (block.type === "table" && block.rows) {
      updateBlock(idx, {
        ...block,
        rows: [...block.rows, { label: "", value: "" }],
      });
    }
  }

  function updateTableRow(
    idx: number,
    rowIdx: number,
    field: "label" | "value",
    val: string,
  ) {
    const block = blocks[idx];
    if (block.type === "table" && block.rows) {
      const newRows = [...block.rows];
      newRows[rowIdx][field] = val;
      updateBlock(idx, { ...block, rows: newRows });
    }
  }

  function deleteTableRow(idx: number, rowIdx: number) {
    const block = blocks[idx];
    if (block.type === "table" && block.rows) {
      updateBlock(idx, {
        ...block,
        rows: block.rows.filter((_, i) => i !== rowIdx),
      });
    }
  }

  function addListItem(idx: number) {
    const block = blocks[idx];
    if (block.type === "list" && block.items) {
      updateBlock(idx, { ...block, items: [...block.items, ""] });
    }
  }

  function updateListItem(idx: number, itemIdx: number, val: string) {
    const block = blocks[idx];
    if (block.type === "list" && block.items) {
      const newItems = [...block.items];
      newItems[itemIdx] = val;
      updateBlock(idx, { ...block, items: newItems });
    }
  }

  function deleteListItem(idx: number, itemIdx: number) {
    const block = blocks[idx];
    if (block.type === "list" && block.items) {
      updateBlock(idx, {
        ...block,
        items: block.items.filter((_, i) => i !== itemIdx),
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((type) => (
          <Button
            key={type.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock(type.value)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> {type.label}
          </Button>
        ))}
      </div>

      {/* Content blocks */}
      <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3 bg-slate-50">
        {blocks.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">
            No content blocks yet. Add one above.
          </p>
        ) : (
          blocks.map((block, idx) => (
            <Card key={idx} className="border">
              <CardContent className="p-3">
                {/* Block header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900">
                        Block {idx + 1}:{" "}
                        {BLOCK_TYPES.find((t) => t.value === block.type)?.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBlock(idx, "up")}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                    )}
                    {idx < blocks.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBlock(idx, "down")}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(idx)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedIdx(expandedIdx === idx ? null : idx)
                      }
                      className="h-6 w-6 p-0"
                    >
                      {expandedIdx === idx ? "−" : "+"}
                    </Button>
                  </div>
                </div>

                {/* Block content editor */}
                {expandedIdx === idx && (
                  <div className="space-y-3 pt-3 border-t">
                    {(block.type === "paragraph" ||
                      block.type === "heading" ||
                      block.type === "subheading" ||
                      block.type === "tip") && (
                      <div>
                        <Label className="text-xs font-medium mb-1 block">
                          Text Content
                        </Label>
                        <Textarea
                          value={block.text || ""}
                          onChange={(e) =>
                            updateBlock(idx, {
                              ...block,
                              text: e.target.value,
                            })
                          }
                          placeholder={
                            block.type === "heading"
                              ? "Enter heading text..."
                              : block.type === "tip"
                                ? "Enter tip/note content..."
                                : "Enter paragraph text..."
                          }
                          className="text-xs min-h-20 resize-none"
                        />
                      </div>
                    )}

                    {block.type === "table" && block.rows && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-medium">
                            Table Rows
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTableRow(idx)}
                            className="text-xs h-6"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Row
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {block.rows.map((row, rowIdx) => (
                            <div
                              key={rowIdx}
                              className="flex gap-2 items-start"
                            >
                              <Input
                                value={row.label}
                                onChange={(e) =>
                                  updateTableRow(
                                    idx,
                                    rowIdx,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                placeholder="Label"
                                className="text-xs flex-1"
                              />
                              <Input
                                value={row.value}
                                onChange={(e) =>
                                  updateTableRow(
                                    idx,
                                    rowIdx,
                                    "value",
                                    e.target.value,
                                  )
                                }
                                placeholder="Value"
                                className="text-xs flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTableRow(idx, rowIdx)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === "list" && block.items && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-medium">Items</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addListItem(idx)}
                            className="text-xs h-6"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Item
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {block.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex gap-2">
                              <Input
                                value={item}
                                onChange={(e) =>
                                  updateListItem(idx, itemIdx, e.target.value)
                                }
                                placeholder="List item"
                                className="text-xs flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteListItem(idx, itemIdx)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* JSON preview */}
      <details className="border rounded-lg p-3 bg-slate-50">
        <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900">
          JSON Preview
        </summary>
        <pre className="text-xs bg-slate-900 text-slate-100 p-2 rounded mt-2 overflow-x-auto max-h-40">
          {JSON.stringify(blocks, null, 2)}
        </pre>
      </details>
    </div>
  );
}
