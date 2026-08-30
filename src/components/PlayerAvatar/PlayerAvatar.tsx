import React from "react";
import "./PlayerAvatar.css";

type AvatarProps = {
  emoji: string;
  color: string;
  size?: number;
  hideScan?: boolean;
};

export function PlayerAvatar({
  emoji,
  color,
  size = 40,
  hideScan = false,
}: AvatarProps) {
  const width = size;
  const height = size * 1.33;

  // Acento compartilhado com o novo painel de missão.
  const retroGreen = "#55e6e0";

  return (
    <div
      style={
        {
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${Math.max(8, size * 0.14)}px`,
          backgroundColor: "#101d31",
          border: `2px solid ${color}`, // Mantém a cor do jogador na borda
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${size * 0.7}px`,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          marginTop: "0px",
          marginBottom: "0px",
        } as React.CSSProperties
      }
    >
      <span style={{ zIndex: 1, fontSize: (width + height) / 3 }}>{emoji}</span>

      {!hideScan && (
        <div
          style={
            {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "1px", // Linha bem fina
              background: `linear-gradient(to right, transparent, ${retroGreen} 50%, transparent)`,
              boxShadow: `0 0 8px 1px ${retroGreen}`, // Brilho de fósforo
              animation: "scanLine 2.5s linear infinite",
              zIndex: 2,
            } as React.CSSProperties
          }
        />
      )}

      {/* Opcional: Efeito de Scanlines estáticas (linhas horizontais de fundo) para o PC Antigo */}
      <div className="crt-overlay"></div>
    </div>
  );
}
