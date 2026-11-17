import React from 'react';

interface DemoQrCodeProps {
  upiId: string;
  businessName: string;
  size?: number;
}

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const DemoQrCode: React.FC<DemoQrCodeProps> = ({ upiId, businessName, size = 180 }) => {
  const gridSize = 21;
  const seed = hashString(upiId || businessName || 'digithela.demo@upi');

  const isFinderCell = (r: number, c: number): boolean => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= gridSize - 7;
    const inBottomLeft = r >= gridSize - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const isFinderFilled = (r: number, c: number): boolean => {
    const localR = r >= gridSize - 7 ? r - (gridSize - 7) : r;
    const localC = c >= gridSize - 7 ? c - (gridSize - 7) : c;
    if (localR === 0 || localR === 6 || localC === 0 || localC === 6) return true;
    if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) return true;
    return false;
  };

  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (isFinderCell(r, c)) {
        if (isFinderFilled(r, c)) cells.push({ r, c });
      } else {
        const bit = ((seed ^ (r * 37 + c * 73)) >>> ((r + c) % 16)) & 1;
        if (bit === 1 || (r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) {
          cells.push({ r, c });
        }
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-center bg-white border border-[#242D2A]/12 rounded-xl p-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        className="rounded-md bg-white"
        role="img"
        aria-label={`Illustrative Demo UPI QR Code for ${businessName}`}
      >
        <rect width={gridSize} height={gridSize} fill="#FFFFFF" />
        {cells.map(({ r, c }) => (
          <rect
            key={`${r}-${c}`}
            x={c}
            y={r}
            width={0.92}
            height={0.92}
            rx={0.12}
            fill="#174C3C"
          />
        ))}
      </svg>
      <p className="mt-2.5 text-[11px] font-mono tracking-wide text-[#242D2A]/70">
        DEMO QR PLACEHOLDER ONLY
      </p>
    </div>
  );
};
