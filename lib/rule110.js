import random from "random";
import seedrandom from "seedrandom";

export default function getGrid(width, generations) {
  const seed = "SoftwareAscending";
  const rng = random.clone(seedrandom(seed));
  const row = new Array(width).fill(null).map(() => (rng.boolean() ? 1 : 0));
  const grid = [row];
  for (let i = 0; i < generations; i++) {
    grid.push(nextRow(grid[grid.length - 1], i / generations, rng));
  }
  return grid;
}

function nextRow(row, pct, rng) {
  const width = row.length;
  const nextGen = new Array(width).fill(0);
  for (let i = 0; i < row.length; i++) {
    const prev = row[(i + row.length - 1) % row.length];
    const next = row[(i + 1) % row.length];
    const curr = row[i];
    const val = prev * 4 + curr * 2 + next;
    if (val === 7 || val === 4 || val === 0) {
      nextGen[i] = 0;
    } else {
      nextGen[i] = 1;
    }
    if (rng.float() < pct * pct) {
      nextGen[i] = 0;
    }
  }
  return nextGen;
}
