export const COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F1C40F",
  "#8E44AD",
  "#E74C3C",
  "#3498DB",
  "#2ECC71",
  "#9B59B6",
  "#F39C12",
  "#D35400",
  "#1ABC9C",
] as const;

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
