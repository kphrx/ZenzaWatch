import {Emitter} from '../../../lib/src/Emitter';
//===BEGIN===

class StoryboardInfoModel extends Emitter {
  static get blankData() {
    return {
      format: 'dmc',
      status: 'fail',
      duration: 1,
      storyboard: {
        version: "1",
        thumbnail: {
          width: 160,
          height: 90,
        },
        columns: 1,
        rows: 1,
        interval: 1000,
        images: [{
          timestamp: 0,
          url: 'https://example.com'
        }],
      }
    };
  }

  constructor(rawData) {
    super();
    this.update(rawData);
  }

  update(rawData) {
    if (!rawData || rawData.status !== 'ok') {
      this._rawData = this.constructor.blankData;
    } else {
      this._rawData = rawData;
    }
    this.primary = this._rawData.storyboard;
    this.emit('update', this);
    return this;
  }
  reset() {
    this._rawData = this.constructor.blankData;
    this.emit('reset');
  }
  get rawData() {
    return this._rawData || this.constructor.blankData;
  }

  get isAvailable() {return this._rawData.status === 'ok';}

  get hasSubStoryboard() { return false; }

  get status() {return this._rawData.status;}
  get message() {return this._rawData.message;}
  get duration() {return this._rawData.duration * 1;}
  get isDmc() {return this._rawData.format === 'dmc';}
  get urls() { return this.primary.images.map(img => img.url); }
  get images() {
    return [...Array(this.pageCount)].map((a, i) => this.getPage(i));
  }
  get cellWidth() { return this.primary.thumbnail.width * 1; }
  get cellHeight() { return this.primary.thumbnail.height * 1; }
  get cellIntervalMs() { return this.primary.interval * 1; }
  get cellCount() { return this.primary.count * 1; }
  get rows() { return this.primary.rows * 1; }
  get cols() { return this.primary.columns * 1; }
  get pageCount() { return this.primary.images.length; }
  get totalRows() { return Math.ceil(this.cellCount / this.cols); }
  get pageWidth() { return this.cellWidth * this.cols; }
  get pageHeight() { return this.cellHeight * this.rows; }
  get countPerPage() { return this.rows * this.cols; }

  /**
   *  nページ目のURL/Bufferを返す。 ゼロオリジン
   */
  getPage(page) {
    const {url, buffer} = this.primary.images[page];
    return buffer ?? url;
  }

  /**
   * msに相当するサムネは何番目か？を返す
   */
  getIndex(ms) {
    // msec -> sec
    const v = Math.max(0, Math.min(this.duration, Math.floor(ms / 1000)));

    // サムネの総数 ÷ 秒数
    // Math.maxはゼロ除算対策
    const n = this.cellCount / Math.max(1, this.duration);

    return Math.floor(v * n);
  }

  /**
   * Indexのサムネイルは何番目のページにあるか？を返す
   */
  getPageIndex(thumbnailIndex) {
    const perPage = this.countPerPage;
    const pageIndex = Math.floor(thumbnailIndex / perPage);
    return Math.max(0, Math.min(this.pageCount, pageIndex));
  }

  /**
   *  msに相当するサムネは何ページの何番目にあるか？を返す
   */
  getThumbnailPosition(ms) {
    const index = this.getIndex(ms);
    const page = this.getPageIndex(index);

    const mod = index % this.countPerPage;
    const row = Math.floor(mod / Math.max(1, this.cols));
    const col = mod % this.rows;
    return {
      page,
      url: this.getPage(page),
      index,
      row,
      col
    };
  }
}

//===END===
export {StoryboardInfoModel};