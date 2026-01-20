import { useEffect, useRef, useState } from "react";
import embed from "vega-embed";

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

interface StreamingContentProps {
  segments: ContentSegment[];
}

function LoadingChart() {
  return (
    <div
      style={{
        margin: "24px 0",
        padding: "24px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e0e0e0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            animation: "bounce 1.4s infinite ease-in-out both",
            animationDelay: "-0.32s",
          }}
        />
        <div
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            animation: "bounce 1.4s infinite ease-in-out both",
            animationDelay: "-0.16s",
          }}
        />
        <div
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            animation: "bounce 1.4s infinite ease-in-out both",
          }}
        />
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function VegaChart({ spec }: { spec: VegaSpec }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      setIsLoading(true);
      setHasError(false);
      containerRef.current.innerHTML = "";

      // Ensure loading shows for at least 500ms for better UX
      const minLoadTime = new Promise((resolve) => setTimeout(resolve, 500));

      Promise.all([
        embed(containerRef.current, spec, {
          actions: {
            export: true,
            source: false,
            compiled: false,
            editor: false,
          },
          config: {
            view: { continuousWidth: 600, continuousHeight: 400 },
            bar: { discreteBandSize: 40 },
          },
        }),
        minLoadTime,
      ])
        .then(() => setIsLoading(false))
        .catch((err) => {
          console.error("Ошибка рендеринга Vega:", err);
          setIsLoading(false);
          setHasError(true);
        });
    }
  }, [spec]);

  return (
    <div
      style={{
        margin: "24px 0",
        padding: "24px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e0e0e0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        position: "relative",
        minHeight: "400px",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              animation: "bounce 1.4s infinite ease-in-out both",
              animationDelay: "-0.32s",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              animation: "bounce 1.4s infinite ease-in-out both",
              animationDelay: "-0.16s",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              animation: "bounce 1.4s infinite ease-in-out both",
            }}
          />
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% {
                transform: scale(0);
                opacity: 0.5;
              }
              40% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
      {hasError && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "#dc2626",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠</div>
          <div style={{ fontSize: "14px" }}>Ошибка рендеринга графика</div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  );
}

export default function StreamingContent({ segments }: StreamingContentProps) {
  return (
    <div
      style={{
        fontSize: "15px",
        lineHeight: "1.6",
        color: "#2c3e50",
      }}
    >
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <div
              key={index}
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                marginBottom: "8px",
              }}
            >
              {segment.content as string}
            </div>
          );
        } else if (segment.type === "chart-loading") {
          return <LoadingChart key={index} />;
        } else {
          return <VegaChart key={index} spec={segment.content as VegaSpec} />;
        }
      })}
    </div>
  );
}
