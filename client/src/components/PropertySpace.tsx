// File: src/components/PropertySpace.tsx
// Updated to match original board design

import React from "react";
import type { Property, Player } from "../utils/interfaces";

interface PropertySpaceProps {
  prop: Property;
  players: Player[];
  onClick?: () => void;
}

export const PropertySpace: React.FC<PropertySpaceProps> = ({
  prop,
  players,
  onClick,
}) => {
  // Get players on this space
  const playersHere = players.filter(
    (p) => p.position === prop.position && !p.bankrupt
  );

  // Determine if this is a corner space
  const isCorner = [0, 10, 20, 30].includes(prop.position);

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full flex flex-col overflow-hidden cursor-pointer transition-all hover:opacity-80 ${
        isCorner ? "bg-gray-900" : "bg-white"
      }`}
      style={{
        border: "2px solid #000",
      }}
    >
      {/* Property Color Bar (Top for properties) */}
      {prop.color && prop.type === "property" && (
        <div
          className={`w-full ${isCorner ? "h-6" : "h-4 sm:h-5"} ${prop.color}`}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col items-center justify-between p-0.5 sm:p-1 ${
          isCorner ? "text-white" : "text-black"
        }`}
      >
        {/* Property Name */}
        <div
          className={`font-bold text-center w-full ${
            isCorner
              ? "text-[0.5rem] sm:text-xs"
              : "text-[0.4rem] sm:text-[0.55rem]"
          }`}
          style={{ lineHeight: "1.1" }}
        >
          {prop.name}
        </div>

        {/* Price */}
        {prop.price > 0 && (
          <div
            className={`font-black ${
              isCorner
                ? "text-yellow-400 text-[0.5rem] sm:text-xs"
                : "text-gray-700 text-[0.4rem] sm:text-[0.5rem]"
            }`}
          >
            ${prop.price}
          </div>
        )}

        {/* Railroad/Utility Icons */}
        {prop.type === "railroad" && (
          <div className="text-lg sm:text-2xl my-1">🚂</div>
        )}
        {prop.type === "utility" && (
          <div className="text-lg sm:text-2xl my-1">
            {prop.name.includes("Electric") ? "💡" : "💧"}
          </div>
        )}

        {/* Special Space Icons */}
        {prop.name === "GO" && (
          <div className="text-3xl sm:text-5xl font-black text-green-400">
            →
          </div>
        )}
        {prop.name === "Go To Jail" && (
          <div className="text-2xl sm:text-4xl">👮</div>
        )}
        {prop.name === "Just Visiting" && (
          <div className="text-xl sm:text-2xl">
            <div className="text-orange-400">JUST</div>
            <div className="text-orange-400">VISITING</div>
          </div>
        )}
        {prop.name === "Free Parking" && (
          <div className="text-3xl sm:text-5xl">🅿️</div>
        )}
        {prop.name === "Chance" && <div className="text-xl sm:text-3xl">?</div>}
        {prop.name === "Community Chest" && (
          <div className="text-xl sm:text-2xl">
            <div className="text-blue-600">📦</div>
          </div>
        )}
        {prop.name === "Income Tax" && (
          <div className="text-center">
            <div className="text-xs font-bold">INCOME</div>
            <div className="text-xs font-bold">TAX</div>
            <div className="text-xs font-black text-red-600">$200</div>
          </div>
        )}
        {prop.name === "Luxury Tax" && (
          <div className="text-center">
            <div className="text-xs font-bold">LUXURY</div>
            <div className="text-xs font-bold">TAX</div>
            <div className="text-xs font-black text-red-600">$100</div>
          </div>
        )}

        {/* Owner Indicator (Small piece at top) */}
        {prop.owner !== null &&
          players[prop.owner] &&
          prop.type === "property" && (
            <div
              className={`absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 ${
                players[prop.owner].color
              } rounded-bl-lg flex items-center justify-center text-[0.5rem] sm:text-xs border-l-2 border-b-2 border-black`}
            >
              {players[prop.owner].piece}
            </div>
          )}

        {/* Houses/Hotels Display */}
        {prop.houses > 0 && (
          <div className="absolute top-0 left-0 flex gap-0.5 p-0.5">
            {prop.houses < 5 ? (
              // Houses - Green boxes
              Array.from({ length: prop.houses }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-600 border border-green-800"
                  title="House"
                />
              ))
            ) : (
              // Hotel - Red box
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 border-2 border-red-900"
                title="Hotel"
              />
            )}
          </div>
        )}

        {/* Mortgaged Overlay */}
        {prop.mortgaged && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-70 flex items-center justify-center">
            <div className="transform -rotate-45 bg-red-600 text-white font-black text-[0.4rem] sm:text-xs px-1 sm:px-2 py-0.5">
              MORTGAGED
            </div>
          </div>
        )}
      </div>

      {/* Players on this Space (Bottom) */}
      {playersHere.length > 0 && (
        <div
          className={`absolute bottom-0 left-0 right-0 flex justify-center items-center gap-0.5 bg-black bg-opacity-50 ${
            isCorner ? "h-6 sm:h-8" : "h-4 sm:h-5"
          }`}
        >
          {playersHere.slice(0, 4).map((player) => (
            <div
              key={player.id}
              className={`${
                player.color
              } rounded-full border border-white flex items-center justify-center ${
                isCorner
                  ? "w-5 h-5 sm:w-6 sm:h-6 text-xs sm:text-sm"
                  : "w-3 h-3 sm:w-4 sm:h-4 text-[0.5rem] sm:text-xs"
              }`}
              title={player.name}
            >
              {player.piece}
            </div>
          ))}
          {playersHere.length > 4 && (
            <div
              className={`bg-gray-600 rounded-full border border-white flex items-center justify-center ${
                isCorner
                  ? "w-5 h-5 sm:w-6 sm:h-6 text-xs"
                  : "w-3 h-3 sm:w-4 sm:h-4 text-[0.5rem]"
              }`}
            >
              +{playersHere.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
