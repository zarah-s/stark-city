import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

export const DiceIcon = ({ value }: { value: number }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[value - 1];
  return <Icon className="w-8 h-8" />;
};
