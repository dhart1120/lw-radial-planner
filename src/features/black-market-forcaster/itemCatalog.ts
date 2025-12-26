import forecasterData from "./data.json";

export type ForecasterItem = {
  id: keyof typeof forecasterData.items;
  name: string;
  icon: string;
};

export function listItems(): ForecasterItem[] {
  return Object.values(forecasterData.items)
    .map((item) => ({
      id: item.id,
      name: item.name,
      icon: new URL(`../../assets/images/icons/${item.id}.png`, import.meta.url).href,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isItemInCatalog(itemId: string): boolean {
  return Boolean(forecasterData.items[itemId as keyof typeof forecasterData.items]);
}
