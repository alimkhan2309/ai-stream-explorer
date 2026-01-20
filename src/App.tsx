import { useRef, useState } from "react";
import StreamingContent from "./components/StreamingContent";
import { parseStreamContent } from "./utils/vegaParser";

type StreamEvent =
  | { event: "token"; data: { delta: string } }
  | { event: "done"; data: any }
  | { event: "error"; data: { message: string } };

function App() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">(
    "idle"
  );
  const [outputText, setOutputText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRunningRef = useRef(false);

  const loadFile = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;

      const parsedEvents = text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line) as StreamEvent);

      setEvents(parsedEvents);
      setStatus("idle");
      setOutputText("");

      console.log("Loaded events:", parsedEvents.length);
    };

    reader.readAsText(file);
  };

  const clearFile = () => {
    setEvents([]);
    setStatus("idle");
    setOutputText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const play = async () => {
    if (events.length === 0) return;

    isRunningRef.current = true;
    setStatus("streaming");
    setOutputText("");

    let accumulatedText = "";

    for (const event of events) {
      if (!isRunningRef.current) break;

      const delay = 50 + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (event.event === "token") {
        accumulatedText += event.data.delta;
        setOutputText(accumulatedText);
      } else if (event.event === "done") {
        setStatus("done");
        isRunningRef.current = false;
        break;
      } else if (event.event === "error") {
        setStatus("error");
        isRunningRef.current = false;
        break;
      }
    }
  };

  const stop = () => {
    isRunningRef.current = false;
    setStatus("idle");
  };

  const segments = parseStreamContent(outputText);

  const getStatusColor = () => {
    switch (status) {
      case "streaming":
        return "#3b82f6";
      case "done":
        return "#10b981";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusEmoji = () => {
    switch (status) {
      case "streaming":
        return "⏳";
      case "done":
        return "✓";
      case "error":
        return "✗";
      default:
        return "○";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}
          >
            AI Stream Explorer
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>
            Visualize LLM streaming responses with embedded Vega-Lite charts
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="file"
              accept=".jsonl"
              ref={fileInputRef}
              style={{
                padding: "10px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                flex: "1",
                minWidth: "200px",
              }}
            />
            <button
              onClick={loadFile}
              style={{
                padding: "10px 24px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#3b82f6")
              }
            >
              Load Dump
            </button>
            {events.length > 0 && (
              <button
                onClick={clearFile}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#fee2e2";
                  e.currentTarget.style.borderColor = "#fca5a5";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#64748b";
                }}
                title="Clear file"
              >
                <span style={{ fontSize: "16px" }}>×</span> Clear
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={play}
              disabled={events.length === 0 || status === "streaming"}
              style={{
                padding: "10px 24px",
                backgroundColor:
                  events.length === 0 || status === "streaming"
                    ? "#cbd5e1"
                    : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor:
                  events.length === 0 || status === "streaming"
                    ? "not-allowed"
                    : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                if (events.length > 0 && status !== "streaming") {
                  e.currentTarget.style.backgroundColor = "#059669";
                }
              }}
              onMouseOut={(e) => {
                if (events.length > 0 && status !== "streaming") {
                  e.currentTarget.style.backgroundColor = "#10b981";
                }
              }}
            >
              ▶ Play
            </button>

            <button
              onClick={stop}
              disabled={status !== "streaming"}
              style={{
                padding: "10px 24px",
                backgroundColor: status !== "streaming" ? "#cbd5e1" : "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: status !== "streaming" ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                if (status === "streaming") {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                }
              }}
              onMouseOut={(e) => {
                if (status === "streaming") {
                  e.currentTarget.style.backgroundColor = "#ef4444";
                }
              }}
            >
              ■ Stop
            </button>

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "18px",
                  }}
                >
                  {getStatusEmoji()}
                </span>
                <span style={{ color: getStatusColor(), fontWeight: "600" }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              <div
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {events.length} events
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        {outputText && (
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "32px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              minHeight: "200px",
            }}
          >
            <StreamingContent segments={segments} />
          </div>
        )}

        {/* Empty state */}
        {!outputText && status === "idle" && events.length > 0 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "60px 32px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
            <p style={{ margin: 0, fontSize: "16px" }}>
              Press <strong>Play</strong> to start streaming
            </p>
          </div>
        )}

        {!events.length && (
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "60px 32px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
            <p style={{ margin: 0, fontSize: "16px" }}>
              Load a <strong>.jsonl</strong> file to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
