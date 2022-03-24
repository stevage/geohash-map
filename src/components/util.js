export function dateToDays(date) {
    if (String(date).length === 4) {
        date = `${date}-01-01`;
    }
    return Math.floor(new Date(date) / (1000 * 60 * 60 * 24));
}

export function dateToWeekday(date) {
    if (String(date).length === 4) {
        date = `${date}-01-01`;
    }
    return new Date(date).getDay();
}

export function getGraticuleBounds(map) {
    const [minx, miny] = map
        .getBounds()
        .toArray()[0]
        .map(Math.floor);
    const [maxx, maxy] = map
        .getBounds()
        .toArray()[1]
        .map(Math.ceil);
    return [minx, miny, maxx, maxy];
}
