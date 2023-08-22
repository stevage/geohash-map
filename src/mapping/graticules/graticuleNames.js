export async function getGraticuleNames() {
    const url = 'https://fippe.de/graticules.csv'; // 'graticules.csv'
    const rows = await window
        .fetch(url)
        .then((x) => x.text())
        .then((t) => t.split('\n'));
    const names = rows.map((x) => {
        const parts = x.split(';');
        return [parts[0] + ',' + parts[1], parts[2]];
    });
    window.graticuleNamesHash = Object.fromEntries(names);
}
