import type mapboxgl from 'mapbox-gl';
import {
    Expedition,
    ExpeditionIndex,
} from '@/mapping/expeditions/expeditionIndex';
import {
    GraticuleStat,
    GraticuleStats,
} from './mapping/graticules/graticuleStats';
import { FeatureCollection } from 'geojson';

declare global {
    interface Window {
        map: any; // Replace `any` with the correct type if known
        app: {
            yearColors?: string[];
            fippeServer?: string;
            App?: any;
            graticules?: FeatureCollection;
        };
        Filters: any;
        InfluenceControls: any;
        expeditions: any;
        graticulesById: Record<string, GraticuleStat>;
        expeditionsByGraticule: Record<string, Expedition[]>;
        maxParticipants: number;
        maxParticipantsGraticule: string;
        db: ExpeditionIndex;
        si: any;
        graticules: GraticuleStats;
        graticuleNamesP: Promise<any>;
        graticuleNamesHash: Record<string, string>;
    }
}

// type that extends mapboxgl.Map but also with a U property of type any
export type mapU = mapboxgl.Map & { U: any };
export function dateToDays(date: string | number | Date) {
    if (String(date).length === 4) {
        date = `${date}-01-01`;
    }
    return Math.floor(new Date(date).valueOf() / (1000 * 60 * 60 * 24));
}

export function daysToDate(days: number) {
    return new Date(days * 1000 * 60 * 60 * 24).toISOString().slice(0, 10);
}

export function dateToWeekday(date: string | number | Date) {
    if (String(date).length === 4) {
        date = `${date}-01-01`;
    }
    return new Date(date).getDay();
}

export function getGraticuleBounds(map: mapboxgl.Map) {
    const [minx, miny] = map.getBounds().toArray()[0].map(Math.floor);
    const [maxx, maxy] = map.getBounds().toArray()[1].map(Math.ceil);
    return [minx, miny, maxx, maxy];
}

export const string0 = (n: number) => (Object.is(n, -0) ? '-0' : String(n));

export function setUrlParam(key: string, value: string) {
    const url = new URL(window.location.toString());
    if (value) {
        url.searchParams.set(key, value);
    } else {
        url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url);
}

export function getUrlParam(key: string) {
    return new URL(window.location.toString()).searchParams.get(key);
}

export const report = (
    name: any,
    task: (() => any) | (() => Promise<any>),
    isAsync = false
) => {
    const start = performance.now();
    if (isAsync) {
        console.log('async start', name);
        return (task as () => Promise<any>)().then((ret) => {
            console.log(
                `${name} in`,
                Math.round(performance.now() - start),
                `ms`
            );
            return ret;
        });
    } else {
        const ret = task();
        console.log(`${name} in`, Math.round(performance.now() - start), `ms`);
        return ret;
    }
};
