import { useState } from "react";

const FALLBACK_COLORS = [
  { bg: "#C9743E", text: "#16110A" }, // terracotta
  { bg: "#7FA38F", text: "#0E1311" }, // sage
  { bg: "#E8A33D", text: "#16110A" }, // saffron/accent
  { bg: "#6E9AA6", text: "#0E1311" }, // dusty teal
];

function pickColor(name) {
  if (!name) return FALLBACK_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const Avatar = ({
  src,
  name,
  size = 40,
  className = "",
  style = {},
  online,
  onlineSize = 10,
  borderColor = "var(--ng-panel)",
  ring = false,
  ringColor,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = src && !imgFailed;
  const color = pickColor(name);
  const initials = getInitials(name);
  const label = name || "User avatar";

  const effectiveRingColor = ringColor || (ring ? "var(--ng-terracotta)" : null);

  const baseStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: Math.max(10, Math.round(size * 0.38)),
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    flexShrink: 0,
    position: "relative",
    backgroundColor: showImage ? "transparent" : color.bg,
    color: color.text,
    userSelect: "none",
    boxShadow: effectiveRingColor
      ? `0 0 0 2px var(--ng-panel), 0 0 0 4px ${effectiveRingColor}`
      : "none",
    ...style,
  };

  return (
    <div
      className={className}
      style={baseStyle}
      role="img"
      aria-label={label}
    >
      {showImage ? (
        <img
          src={src}
          alt={label}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}

      {online !== undefined && (
        <span
          aria-label={online ? "Online" : "Offline"}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: onlineSize,
            height: onlineSize,
            borderRadius: "50%",
            backgroundColor: online ? "var(--ng-online)" : "var(--ng-muted)",
            border: `2px solid ${borderColor}`,
          }}
        />
      )}
    </div>
  );
};

export default Avatar;
