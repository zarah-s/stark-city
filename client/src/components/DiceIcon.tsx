// File: src/components/DiceIcon.tsx

import React from "react";

interface DiceIconProps {
  value: number;
}

export const DiceIcon: React.FC<DiceIconProps> = ({ value }) => {
  const dotPositions: { [key: number]: string[] } = {
    1: ["center"],
    2: ["top-left", "bottom-right"],
    3: ["top-left", "center", "bottom-right"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: [
      "top-left",
      "top-right",
      "middle-left",
      "middle-right",
      "bottom-left",
      "bottom-right",
    ],
  };

  const getDotPosition = (position: string) => {
    const positions: { [key: string]: string } = {
      "top-left": "top-1 left-1",
      "top-right": "top-1 right-1",
      "middle-left": "top-1/2 -translate-y-1/2 left-1",
      "middle-right": "top-1/2 -translate-y-1/2 right-1",
      center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      "bottom-left": "bottom-1 left-1",
      "bottom-right": "bottom-1 right-1",
    };
    return positions[position] || "";
  };

  return (
    <div className="relative w-12 h-12 sm:w-16 sm:h-16">
      {/* Dice dots */}
      {dotPositions[value]?.map((position, index) => (
        <div
          key={index}
          className={`absolute w-2 h-2 sm:w-3 sm:h-3 bg-gray-900 rounded-full ${getDotPosition(
            position
          )}`}
        />
      ))}
    </div>
  );
};
