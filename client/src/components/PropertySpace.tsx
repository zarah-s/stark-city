import type { Player, Property } from "../utils/interfaces";

export const PropertySpace = ({
  prop,
  players,
}: {
  prop: Property;
  players: Player[];
}) => {
  const playersHere = players.filter((p) => p.position === prop.position);

  if (prop.type === "property") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-gray-50 to-white border-2 border-gray-900 flex flex-col text-[10px] relative shadow-inner">
        <div
          className={`${prop.color} h-6 w-full flex items-center justify-center text-white font-bold text-[8px]`}
        >
          {prop.owner !== null && players[prop.owner] && (
            <div
              className={`w-2 h-2 rounded-full ${
                players[prop.owner].color
              } absolute top-1 ring-2 ring-white`}
            ></div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-1 text-center leading-tight">
          <div className="font-bold">{prop.name.split(" ")[0]}</div>
          <div className="font-bold">
            {prop.name.split(" ").slice(1).join(" ")}
          </div>
          <div className="text-[9px] font-black mt-1 text-green-700">
            ${prop.price}
          </div>
          {prop.houses > 0 && (
            <div className="flex gap-0.5 mt-1">
              {prop.houses === 5 ? (
                <div className="text-red-600 text-xs animate-pulse">🏨</div>
              ) : (
                Array.from({ length: prop.houses }).map((_, i) => (
                  <div key={i} className="text-green-600 text-[8px]">
                    🏠
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.type === "railroad") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-900 flex flex-col items-center justify-center text-[10px] p-1 relative shadow-inner">
        <div className="font-bold text-center leading-tight text-[9px] text-yellow-400">
          {prop.name}
        </div>
        <div className="text-2xl">🚂</div>
        <div className="font-bold text-[9px] text-green-400">${prop.price}</div>
        {prop.owner !== null && players[prop.owner] && (
          <div
            className={`w-2 h-2 rounded-full ${
              players[prop.owner].color
            } absolute top-1 ring-2 ring-white`}
          ></div>
        )}
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.type === "utility") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-gray-900 flex flex-col items-center justify-center text-[10px] p-1 relative shadow-inner">
        <div className="font-bold text-center leading-tight text-[9px] text-blue-900">
          {prop.name}
        </div>
        <div className="text-2xl">
          {prop.name.includes("Electric") ? "💡" : "💧"}
        </div>
        <div className="font-bold text-[9px] text-green-700">${prop.price}</div>
        {prop.owner !== null && players[prop.owner] && (
          <div
            className={`w-2 h-2 rounded-full ${
              players[prop.owner].color
            } absolute top-1 ring-2 ring-white`}
          ></div>
        )}
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "GO") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 border-2 border-gray-900 flex flex-col items-center justify-center text-white font-black relative shadow-lg">
        <div className="text-3xl rotate-180 animate-pulse">→</div>
        <div className="text-xs">GO</div>
        <div className="text-[8px]">COLLECT $200</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-3xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Just Visiting") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-gray-900 relative shadow-lg">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-black">
          <div className="text-xs">JUST</div>
          <div className="text-xs">VISITING</div>
        </div>
        <div className="absolute top-1 right-1 text-3xl animate-pulse">🚔</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-3xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Free Parking") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-gray-900 flex flex-col items-center justify-center text-white font-black relative shadow-lg">
        <div className="text-2xl animate-bounce">🅿️</div>
        <div className="text-[10px]">FREE</div>
        <div className="text-[10px]">PARKING</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-3xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Go To Jail") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-gray-900 flex flex-col items-center justify-center text-white font-black relative shadow-lg">
        <div className="text-2xl animate-pulse">👮</div>
        <div className="text-[9px]">GO TO</div>
        <div className="text-[9px]">JAIL</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-3xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Community Chest") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-gray-900 flex flex-col items-center justify-center relative shadow-inner">
        <div className="text-2xl">📦</div>
        <div className="text-[8px] font-black text-center leading-tight text-amber-900">
          COMMUNITY
          <br />
          CHEST
        </div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Chance") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-pink-100 to-pink-200 border-2 border-gray-900 flex flex-col items-center justify-center relative shadow-inner">
        <div className="text-2xl animate-spin-slow">❓</div>
        <div className="text-[9px] font-black text-pink-900">CHANCE</div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Income Tax") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-red-100 to-red-200 border-2 border-gray-900 flex flex-col items-center justify-center relative shadow-inner">
        <div className="text-2xl">💰</div>
        <div className="text-[8px] font-black text-center leading-tight text-red-900">
          INCOME
          <br />
          TAX
          <br />
          $200
        </div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (prop.name === "Luxury Tax") {
    return (
      <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-gray-900 flex flex-col items-center justify-center relative shadow-inner">
        <div className="text-2xl animate-pulse">💎</div>
        <div className="text-[8px] font-black text-center leading-tight text-indigo-900">
          LUXURY
          <br />
          TAX
          <br />
          $100
        </div>
        {playersHere.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className="text-2xl drop-shadow-2xl animate-bounce"
              >
                {p.piece}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white border-2 border-gray-900"></div>
  );
};
