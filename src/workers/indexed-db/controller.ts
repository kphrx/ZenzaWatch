
import {AsyncReturnType} from './types';

interface OpenCommand {
  command: 'open';
  params: {
    name: string;
    version?: number;
    stores?: {
      name: string;
      definition?: IDBObjectStoreParameters;
      indexes?: {
        name: string;
        keyPath?: string | string[];
        params?: IDBIndexParameters;
      }[];
    }[];
  };
}
interface CloseCommand {
  command: 'close';
  params: {name: string};
}

interface IndexedDBGetStore {
  name: string;
  storeName: string;
}

interface RawStoreData {
  [key: string]: string | number;
}

interface StoreData extends RawStoreData {
  updatedAt: number;
}

interface PutCommand {
  command: 'put';
  params: IndexedDBGetStore & {
    data: RawStoreData;
  };
}
interface GetCommand {
  command: 'get';
  params: IndexedDBGetStore & {
    data: {
      key: string;
      index: string;
      timeout: number;
    };
  };
}
interface UpdateTimeCommand {
  command: 'updateTime';
  params: IndexedDBGetStore & {
    data: {
      key: string;
      index: string;
      timeout: number;
    };
  };
}
interface DeleteCommand {
  command: 'delete';
  params: IndexedDBGetStore & {
    data: {
      key: string;
      index: string;
      timeout: number;
    };
  };
}
interface GcCommand {
  command: 'gc';
  params: IndexedDBGetStore & {
    data: {
      expireTime: number; // = 30 * 24 * 60 * 60 * 1000
      index: string; // = 'updatedAt'
    };
  };
}

type Command =
  OpenCommand |
  CloseCommand |
  PutCommand |
  GetCommand |
  UpdateTimeCommand |
  DeleteCommand |
  GcCommand;

type ResultType =
  AsyncReturnType<IndexedDBController['put']> |
  AsyncReturnType<IndexedDBController['get']> |
  AsyncReturnType<IndexedDBController['updateTime']> |
  AsyncReturnType<IndexedDBController['delete']> |
  AsyncReturnType<IndexedDBController['gc']> |
  'ok';

interface GcFail extends DOMException {
  query: {[key: string]: unknown};
}

/**
 * IndexedDB controller.
 */
class IndexedDBController {
  factory: IDBFactory;
  db: {[name:string]: IDBDatabase} = {};

  /**
   * IndexedDB Controller initialize.
   * @param {IDBFactory} factory WindowOrWorkerGlobalScope.indexedDB.
   */
  constructor(factory: IDBFactory) {
    this.factory = factory;
  }

  /**
   * IndexedDB storage open.
   * @param {OpenCommand.params} params database.
   * @return {IDBDatabase} database.
   */
  async open(params: OpenCommand['params']): Promise<IDBDatabase> {
    const {name, version, stores} = params;
    if (this.db[name]) {
      return this.db[name];
    }
    if (stores == null) {
      throw new Error('not found database');
    }
    return await new Promise((resolve, reject) => {
      const req: IDBOpenDBRequest = this.factory.open(name, version);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const store of stores) {
          if (db.objectStoreNames.contains(store.name)) {
            db.deleteObjectStore(store.name);
          }
          const objStore = db.createObjectStore(store.name, store.definition);
          const indexes = [
            ...(store.indexes || []),
            {name: 'updatedAt', params: {unique: false}},
          ];
          for (const idx of indexes) {
            objStore.createIndex(idx.name, idx.keyPath || idx.name, idx.params);
          }
          objStore.transaction.oncomplete = () => {
            console.log(
                'store.transaction.complete',
                JSON.stringify({name, version, store}),
            );
          };
        }
      };
      req.onsuccess = () => {
        this.db[name] = req.result;
        resolve(this.db[name]);
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  }

  /**
   * IndexedDB storage close.
   * @param {CloseCommand.params} params database.
   */
  close({name}: CloseCommand['params']): void {
    this.db[name]?.close();
    delete this.db[name];
  }

  /**
   * Get object store from IndexedDB.
   * @param {IndexedDBGetStore.name} params.name db.
   * @param {IndexedDBGetStore.storeName} params.storeName db.
   * @param {IDBTransactionMode} params.mode db.
   * @return {{store: IDBObjectStore, transaction: IDBTransaction}} store & tx.
   */
  async getStore({name, storeName, mode = 'readonly'}: IndexedDBGetStore & {
    mode?: IDBTransactionMode;
  }): Promise<{
    store: IDBObjectStore;
    transaction: IDBTransaction;
  }> {
    const db = await this.open({name});
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      tx.oncomplete = () => {
        resolve({
          store: tx.objectStore(storeName),
          transaction: tx,
        });
      };
      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  /**
   * Put query.
   * @param {PutCommand.params} params query.
   * @return {IDBValidKey} result.
   */
  async put(
      {name, storeName, data}: PutCommand['params'],
  ): Promise<IDBValidKey> {
    const {store} = await this.getStore({
      name,
      storeName,
      mode: 'readwrite',
    });
    return await new Promise((resolve, reject) => {
      const req = store.put(data);
      req.onsuccess = () => {
        // transaction.commit()
        resolve(req.result);
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  }

  /**
   * Get query.
   * @param {GetCommand.params} params query.
   * @return {Object.<string, number|string>} object store.
   */
  async get(
      {name, storeName, data: {key, index, timeout}}: GetCommand['params'],
  ): Promise<StoreData | null> {
    const {store} = await this.getStore({name, storeName});
    return await new Promise((resolve, reject) => {
      const req = index ? store.index(index).get(key) : store.get(key);
      req.onsuccess = () => {
        resolve(req.result as StoreData);
      };
      req.onerror = () => {
        reject(req.error);
      };
      if (timeout) {
        setTimeout(() => {
          reject(Error(`timeout: {key: ${key}, index: ${index}}`));
        }, timeout);
      }
    });
  }

  /**
   * Update record time.
   * @param {UpdateTimeCommand.params} params query.
   * @return {Object.<string, number|string>} object store.
   */
  async updateTime(
      {name, storeName, data}: UpdateTimeCommand['params'],
  ): Promise<StoreData | null> {
    const record = await this.get({name, storeName, data});
    if (record == null) {
      return null;
    }
    record.updatedAt = Date.now();
    await this.put({name, storeName, data: record});
    return record;
  }

  /**
   * Delete store from IndexedDB.
   * @param {DeleteCommand.params} params query.
   */
  async delete(
      {name, storeName, data: {key, index}}: DeleteCommand['params'],
  ): Promise<boolean> {
    const {store} = await this.getStore({
      name,
      storeName,
      mode: 'readwrite',
    });
    return await new Promise((resolve, reject) => {
      let remove = 0;
      const range = IDBKeyRange.only(key);
      const req = index ?
        store.index(index).openCursor(range) :
        store.openCursor(range);
      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          // transaction.commit()
          return resolve(remove > 0);
        }
        result.delete();
        remove++;
        result.continue();
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  }
  /**
   * Garbage Collection.
   * @param {GcCommand.params} params query.
   */
  async gc(
      {name, storeName, data: {expireTime, index}}: GcCommand['params'],
  ): Promise<{count: number; time: number}> {
    index = index || 'updatedAt';
    const {store} = await this.getStore({name, storeName, mode: 'readwrite'});
    const now = Date.now();
    const ptime = performance.now();
    const expiresAt = (index !== 'expiresAt') ? (now - expireTime) : now;
    const expireDateTime = new Date(expiresAt).toLocaleString();
    const timekey =
      `GC: DELETE FROM ${name}.${storeName} WHERE ${index} < ${expireDateTime}`;
    console.time(timekey);
    let count = 0;
    return await new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(expiresAt);
      const idx = store.index(index);
      const req = idx.openCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor != null) {
          count++;
          cursor.delete();
          return cursor.continue();
        }
        console.timeEnd(timekey);
        resolve({count, time: performance.now() - ptime});
        count && console.log('deleted %s records.', count);
      };
      req.onerror = () => {
        const err = req.error as GcFail;
        err.query = {
          name,
          storeName,
          data: {expireTime, index},
          timekey,
        };
        store.clear();
        reject(err);
      };
    });
  }
}

export {
  IndexedDBController as default,
  GcFail,
  Command,
  ResultType,
};
