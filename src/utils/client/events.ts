type Callback = () => void;

type CityGroup = {
  cityCodes: Set<number>;
  callback: Callback;
};

const cityLoadedEvents = new Map<number, CityGroup[]>();

export function onCitiesLoaded(cityCodes: number[], callback: Callback): void {
  const group = { cityCodes: new Set(cityCodes), callback };
  cityCodes.forEach((cityCode) => {
    if (!cityLoadedEvents.has(cityCode)) {
      cityLoadedEvents.set(cityCode, []);
    }
    cityLoadedEvents.get(cityCode)!.push(group);
  });
}

export function triggerCityLoaded(cityCode: number): void {
  if (cityLoadedEvents.has(cityCode)) {
    const cityGroups = cityLoadedEvents.get(cityCode)!;
    while (cityGroups.length) {
      const group = cityGroups.shift()!;
      group.cityCodes.delete(cityCode);
      if (group.cityCodes.size === 0) {
        group.callback();
      }
    }
  }
}
