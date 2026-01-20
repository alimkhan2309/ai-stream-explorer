export interface VegaSpec {
  $schema?: string;
  mark: string;
  encoding: any;
  data?: any;
  [key: string]: any;
}

export interface ContentSegment {
  type: "text" | "chart" | "chart-loading";
  content: string | VegaSpec;
}

export function extractVegaSpec(text: string): VegaSpec | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);

    // Validate it's a Vega-Lite spec
    if (!parsed.mark || !parsed.encoding) {
      console.warn(
        "JSON не является валидной Vega-Lite спецификацией (отсутствуют mark или encoding)",
      );
      return null;
    }

    // Add $schema if missing
    if (!parsed.$schema) {
      parsed.$schema = "https://vega.github.io/schema/vega-lite/v5.json";
    }

    // Add hardcoded data
    if (!parsed.data) {
      parsed.data = {
        values: [
          { region: "Almaty", revenue: 120 },
          { region: "Astana", revenue: 90 },
          { region: "Shymkent", revenue: 70 },
        ],
      };
    }

    // Add width configuration for better bar sizing
    if (!parsed.width) {
      parsed.width = 500;
    }
    if (!parsed.height) {
      parsed.height = 350;
    }

    return parsed;
  } catch (e) {
    console.error(
      "Ошибка парсинга Vega спецификации:",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

export function parseStreamContent(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];

  // First, check if there's a complete JSON block
  const completeJsonRegex = /```json[\s\S]*?```/g;
  let lastIndex = 0;
  let match;

  const jsonBlocks: Array<{ start: number; end: number }> = [];

  // Find all complete JSON blocks
  while ((match = completeJsonRegex.exec(text)) !== null) {
    jsonBlocks.push({ start: match.index, end: match.index + match[0].length });
  }

  // Check if there's an incomplete JSON block at the end
  const incompleteJsonStart = text.lastIndexOf("```json");
  const lastCompleteEnd =
    jsonBlocks.length > 0 ? jsonBlocks[jsonBlocks.length - 1].end : -1;

  let hasIncompleteBlock = false;
  if (incompleteJsonStart > lastCompleteEnd) {
    jsonBlocks.push({ start: incompleteJsonStart, end: text.length });
    hasIncompleteBlock = true;
  }

  // Now build segments, skipping all JSON block ranges
  let currentPos = 0;

  for (let i = 0; i < jsonBlocks.length; i++) {
    const block = jsonBlocks[i];
    const isLastBlock = i === jsonBlocks.length - 1;

    // Add text before this block
    const beforeText = text.substring(currentPos, block.start);
    if (beforeText.trim()) {
      segments.push({ type: "text", content: beforeText });
    }

    // If block is complete (ends with ```), try to render chart
    const blockText = text.substring(block.start, block.end);
    if (blockText.endsWith("```")) {
      const spec = extractVegaSpec(blockText);
      if (spec) {
        segments.push({ type: "chart", content: spec });
      }
    } else if (isLastBlock && hasIncompleteBlock) {
      // Show loading animation for incomplete block
      segments.push({ type: "chart-loading", content: "" });
    }
    // If incomplete and not last, we skip it (don't render the partial JSON text)

    currentPos = block.end;
  }

  // Add any remaining text after all blocks
  const remainingText = text.substring(currentPos);
  if (remainingText.trim()) {
    segments.push({ type: "text", content: remainingText });
  }

  return segments;
}
