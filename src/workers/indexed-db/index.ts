export {
  AsyncReturnType,
} from './types';

export {
  default as IndexedDBController,
  GcFail,
  Command,
  ResultType,
} from './controller';

/**
 * IndexedDB access worker
 * @return {Worker}
 */
export const IndexedDBAccessWorker = () => {
  return new Worker(new URL('./worker', import.meta.url));
};
