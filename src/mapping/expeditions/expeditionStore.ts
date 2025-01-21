import type { Feature, FeatureCollection, Point } from 'geojson'

async function openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(dbName, 1)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' }) // Use "id" as the primary key
      }
    }

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error
      reject(error)
    }
  })
}

async function saveFeatureCollection(
  db: IDBDatabase,
  storeName: string,
  featureCollection: FeatureCollection<Point>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    featureCollection.features.forEach((feature: Feature<Point>) => {
      const record = {
        id: feature.properties?.id, // Unique key for each feature
        feature,
      }
      store.put(record)
    })

    transaction.oncomplete = () => resolve('FeatureCollection saved successfully!')
    transaction.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}

async function getFeatureCollection(
  db: IDBDatabase,
  storeName: string,
): Promise<FeatureCollection<Point>> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      const features = request.result.map((record: { feature: Feature<Point> }) => record.feature)
      resolve({ type: 'FeatureCollection', features })
    }

    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}

export async function saveExpeditions(expeditions: FeatureCollection<Point>) {
  const dbName = 'db'
  const storeName = 'expeditions'
  const db = await openDatabase(dbName, storeName)
  await saveFeatureCollection(db, storeName, expeditions)
  window.localStorage.setItem('expeditions-updated', new Date().toISOString())
  console.log('expeditions saved', db)
}

export async function getStoredExpeditions(): Promise<FeatureCollection<Point> | null> {
  try {
    const lastUpdated = window.localStorage.getItem('expeditions-updated')
    if (lastUpdated) {
      const dbName = 'db'
      const storeName = 'expeditions'
      const db = await openDatabase(dbName, storeName)
      const fc = await getFeatureCollection(db, storeName)
      if (fc.features.length > 0) {
        return fc
      } else {
        console.log('no stored expeditions actually')
        return null
      }
    }
  } catch (e) {
    console.error(e)
  }
  return null
}

export function secondsSinceExpeditionsUpdated(): number {
  const lastUpdated = window.localStorage.getItem('expeditions-updated')
  if (lastUpdated) {
    const lastUpdatedDate = new Date(lastUpdated)
    const now = new Date()
    const diff = now.getTime() - lastUpdatedDate.getTime()
    return diff / 1000
  }
  return Infinity
}
