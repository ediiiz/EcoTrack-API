const reCollection = {
  GPRMD: /GPRMD/m,
  VehicleName: /\$(.*)\$/m,
  Coordinates: /A,(.*),N,(.*),E/g,
  DegreesMinutes: /(.*)(\d\d)\./m,
  Seconds: /\.(.*)/m,
};

export function getCoordinates(input: string): {
  vehicle: string;
  lat: number;
  lng: number;
} {
  const data = getData(input);

  function getData(input: string): {
    vehicle: string;
    north: string;
    east: string;
  } {
    const matches = input.match(reCollection.GPRMD);
    if (matches && matches[0]) {
      const vehicle = input.match(reCollection.VehicleName)?.[1];
      for (const match of input.matchAll(reCollection.Coordinates)) {
        const data = {
          vehicle,
          north: match[1],
          east: match[2],
        };
        return data;
      }
    } else {
      return { vehicle: undefined, north: undefined, east: undefined };
    }
  }

  function DMM2DD({ DMM }: { DMM: string }): number {
    const matches = DMM.match(reCollection.DegreesMinutes);
    if (matches) {
      const degrees = parseInt(matches[1]);
      const minutes = parseInt(matches[2].replace('0', ''));
      const seconds = parseFloat(`.${DMM.match(reCollection.Seconds)?.[1]}`);
      const decimalDegress = degrees + (minutes + seconds) / 60;
      return parseFloat(decimalDegress.toFixed(6));
    }
  }

  if (typeof data !== 'undefined' && typeof data.vehicle !== 'undefined') {
    const { vehicle, north, east } = data;
    const lat = DMM2DD({ DMM: north });
    const lng = DMM2DD({ DMM: east });
    return { vehicle, lat, lng };
  } else {
    return undefined;
  }
}
