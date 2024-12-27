import {textUtil} from '../packages/lib/src/text/textUtil';
import {PromiseHandler} from '../packages/lib/src/Emitter';

//===BEGIN===
//
class JSONable {
  toJSON() {
    const data = Object.create(null);
    const proto = Object.getPrototypeOf(this);

    for (const prop of Object.getOwnPropertyNames(proto)) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (typeof desc?.get !== 'function') continue;

      const value = data[prop] = this[prop];
      if (value == null || typeof value.toJSON !== 'function') continue;

      data[prop] = value.toJSON();
    }

    return data;
  }
}

class DomandInfo extends JSONable {
  constructor(rawData, videoDetail, linkedChannelVideo) {
    super();
    this._rawData = rawData;
    this._videoDetail = videoDetail;
    this._linkedChannelVideo = linkedChannelVideo;
  }

  get videoId() {
    return this._linkedChannelVideo != null ? this._linkedChannelVideo.linkedVideoId : this._videoDetail.id;
  }

  get accessRightKey() {
    return this._rawData.accessRightKey || '';
  }

  get audios() {
    return this._rawData.audios.toSorted((a, b) => b.qualityLevel > a.qualityLevel);
  }

  get availableAudios() {
    return this.audios.filter(a => a.isAvailable);
  }

  get availableAudioIds() {
    return this.availableAudios.map(a => a.id);
  }

  get videos() {
    return this._rawData.videos.toSorted((a, b) => b.qualityLevel > a.qualityLevel);
  }

  get availableVideos() {
    return this.videos.filter(v => v.isAvailable);
  }

  get availableVideoIds() {
    return this.availableVideos.map(v => v.id);
  }

  get isStoryboardAvailable() {
    return this._rawData.isStoryboardAvailable;
  }
}

class DmcInfo extends JSONable {
  constructor(rawData) {
    super();
    this._rawData = rawData;
    this._session = rawData.movie.session;
  }

  get apiUrl() {
    return this._session.urls[0].url;
  }

  get urls() {
    return this._session.urls;
  }

  get audios() {
    return this._rawData.movie.audios.toSorted((a, b) => b.metadata.levelIndex > a.metadata.levelIndex);
  }

  get availableAudios() {
    return this.audios.filter(a => a.isAvailable);
  }

  get availableAudioIds() {
    return this.availableAudios.map(a => a.id);
  }

  get videos() {
    return this._rawData.movie.videos.toSorted((a, b) => b.metadata.levelIndex > a.metadata.levelIndex);
  }

  get availableVideos() {
    return this.videos.filter(v => v.isAvailable);
  }

  get availableVideoIds() {
    return this.availableVideos.map(v => v.id);
  }

  get signature() {
    return this._session.signature;
  }

  get token() {
    return this._session.token;
  }

  get serviceUserId() {
    return this._session.serviceUserId;
  }

  get contentId() {
    return this._session.contentId;
  }

  get playerId() {
    return this._session.playerId;
  }

  get recipeId() {
    return this._session.recipeId;
  }

  get protocols() {
    return this._session.protocols || [];
  }

  get isHLSRequired() {
    return !this.protocols.includes('http');
  }

  get contentKeyTimeout() {
    return this._session.contentKeyTimeout;
  }

  get priority() {
    return this._session.priority;
  }

  get authTypes() {
    return this._session.authTypes;
  }

  get videoFormatList() {
    return (this.videos || []).concat();
  }

  get hasStoryboard() {
    return !!this._rawData.storyboard;
  }

  get storyboardInfo() {
    return this.hasStoryboard ? this._rawData.storyboard.session : null;
  }

  get transferPreset() {
    return (this._session.transferPresets || [''])[0] || '';
  }

  get heartbeatLifetime() {
    return this._session.heartbeatLifetime || 120 * 1000;
  }

  get contentKeyTimeout() {
    return this._session.contentKeyTimeout || 600 * 1000;
  }

  get importVersion() {
    return this._rawData.import_version || 0;
  }

  get trackingId() {
    return this._rawData.trackingId || '';
  }

  get encryption() {
    return this._rawData.encryption || null;
  }
}

class VideoFilter {
  constructor(ngOwner, ngTag) {
    this.ngOwner = ngOwner;
    this.ngTag = ngTag;
  }

  get ngOwner() {
    return this._ngOwner || [];
  }

  set ngOwner(owner) {
    owner = _.isArray(owner) ? owner : owner.toString().split(/[\r\n]/);
    let list = [];
    owner.forEach(o => {
      list.push(o.replace(/#.*$/, '').trim());
    });
    this._ngOwner = list;
  }

  get ngTag() {
    return this._ngTag || [];
  }

  set ngTag(tag) {
    tag = Array.isArray(tag) ? tag : tag.toString().split(/[\r\n]/);
    const list = [];
    tag.forEach(t => {
      list.push(t.toLowerCase().trim());
    });
    this._ngTag = list;
  }

  isNgVideo(videoInfo) {
    let isNg = false;
    let isChannel = videoInfo.isChannel;
    let ngTag = this.ngTag;

    videoInfo.tagList.forEach(tag => {
      let text = (tag.name || '').toLowerCase();
      if (ngTag.includes(text)) {
        isNg = true;
      }
    });
    if (isNg) {
      return true;
    }

    let owner = videoInfo.owner;
    let ownerId = owner.id;
    if (ownerId && this.ngOwner.includes(ownerId)) {
      isNg = true;
    }

    return isNg;
  }
}

class VideoInfoModel extends JSONable {
  constructor(videoInfoData, localCacheData = {}) {
    super();
    this._update(videoInfoData, localCacheData);
    this._currentVideoPromise = null;
  }

  update(videoInfoModel) {
    this._update(videoInfoModel._rawData);
    return true;
  }

  _update(info, localCacheData = {}) {
    this._rawData = info;
    this._cacheData = localCacheData;
    this._watchApiData = info.watchApiData;
    this._videoDetail = info.watchApiData.videoDetail;
    this._viewerInfo = info.viewerInfo;               // 閲覧者(＝おまいら)の情報
    this._ngFilters = info.ngFilters;
    this._msgInfo = info.msgInfo;
    this._dmcInfo = (info.dmcInfo && info.dmcInfo.movie.session) ? new DmcInfo(info.dmcInfo) : null;
    this._domandInfo = info.domandInfo ? new DomandInfo(info.domandInfo, info.watchApiData.videoDetail, info.linkedChannelVideo) : null;
    this._relatedVideo = info.playlist; // playlistという名前だが実質は関連動画
    this._playlistToken = info.playlistToken;
    this._watchAuthKey = info.watchAuthKey;
    this._seekToken = info.seekToken;
    this._resumeInfo = info.resumeInfo || {};
    this._currentVideo = null;
    this._currentVideoPromise = null;
    return true;
  }

  get title() {
    return this._videoDetail.title_original || this._videoDetail.title;
  }

  get description() {
    return this._videoDetail.description || '';
  }

  /**
   * マイリスト等がリンクになっていない物
   */
  get descriptionOriginal() {
    return this._videoDetail.description_original;
  }

  get postedAt() {
    return this._videoDetail.postedAt;
  }

  get thumbnail() {
    return this._videoDetail.thumbnail;
  }

  /**
   * 大きいサムネがあればそっちを返す
   */
  get betterThumbnail() {
    return this._rawData.thumbnail;
  }

  get largeThumbnnail() {
    return this._videoDetail.largeThumbnnail;
  }

  /**
   * @return Promise
   */
  getCurrentVideo() {
    if (this._currentVideoPromise) {
      return this._currentVideoPromise;
    }
    return this._currentVideoPromise = new PromiseHandler();
  }

  setCurrentVideo(v) {
    this._currentVideo = v;
    this._currentVideoPromise && this._currentVideoPromise.resolve(v);
  }

  get tagList() {
    return this._videoDetail.tagList;
  }

  getVideoId() { // sm12345
    return this.videoId;
  }

  get videoId() {
    return this._videoDetail.id;
  }

  get originalVideoId() {
    return (this.isMymemory || this.isCommunityVideo) ? this.videoId : '';
  }

  getWatchId() { // sm12345だったりスレッドIDだったり
    return this.watchId;
  }

  get watchId() {
    if (this.videoId.substring(0, 2) === 'so') {
      return this.videoId;
    }
    return this._videoDetail.v;
  }

  get contextWatchId() {
    return this._videoDetail.v;
  }

  get watchUrl() {
    return `https://www.nicovideo.jp/watch/${this.watchId}`;
  }

  get threadId() { // watchIdと同一とは限らない
    return this._msgInfo.threadId;
  }

  get videoSize() {
    return {
      width: this._videoDetail.width,
      height: this._videoDetail.height
    };
  }

  get duration() {
    return this._videoDetail.length;
  }

  get count() {
    const vd = this._videoDetail;
    return {
      comment: vd.commentCount,
      mylist: vd.mylistCount,
      view: vd.viewCount
    };
  }

  get isChannel() {
    return !!this._videoDetail.channelId;
  }

  get isMymemory() {
    return !!this._videoDetail.isMymemory;
  }

  get isCommunityVideo() {
    return !!(!this.isChannel && this._videoDetail.communityId);
  }

  get isLiked() {
    return !!this._videoDetail.isLiked;
  }
  set isLiked(v) {
    this._videoDetail.isLiked = v;
  }

  get hasParentVideo() {
    return !!(this._videoDetail.commons_tree_exists);
  }

  get isHLSRequired() {
    if (this.isDmcAvailable) {
      return this.dmcInfo.isHLSRequired
    } else {
      return this.isDomandAvailable;
    }
  }

  get actionTrackId() {
    return this._watchApiData.clientTrackId;
  }

  get isDomandAvailable() {
    return this._rawData.isDomand;
  }

  get isDmcAvailable() {
    return this._rawData.isDmc;
  }

  get domandInfo() {
    return this._domandInfo;
  }

  get dmcInfo() {
    return this._dmcInfo;
  }

  get msgInfo() {
    return this._msgInfo;
  }

  get isDomandOnly() {
    return this.isDomandAvailable && !this.isDmcAvailable;
  }

  get isDmcOnly() {
    return this.isDmcAvailable && !this.isDomandAvailable;
  }

  get hasDomandStoryboard() {
    return this._domandInfo?.isStoryboardAvailable ?? false;
  }

  get hasDmcStoryboard() {
    return this._dmcInfo?.hasStoryboard ?? false;
  }

  get dmcStoryboardInfo() {
    return this.hasDmcStoryboard ? this._dmcInfo.storyboardInfo : null;
  }

  get hasStoryboard() {
    return this.hasDomandStoryboard || this.hasDmcStoryboard;
  }

  /**
   * 投稿者の情報
   * チャンネル動画かどうかで分岐
   */
  get owner() {
    if (this.isChannel) {
      let {
        iconUrl: icon = 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg',
        id,
        linkId = '',
        name,
      } = {...this._watchApiData.channelInfo};
      return {
        type: 'channel',
        url: `https://ch.nicovideo.jp/${linkId}`,
        icon,
        id,
        linkId,
        name,
      };
    } else {
      // 退会しているユーザーだと空になっている
      let {
        iconUrl: icon = 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg',
        id,
        linkId = '',
        name = '(非公開ユーザー)',
      } = {...this._watchApiData.uploaderInfo};
      return {
        type: 'user',
        url: id ? `https://www.nicovideo.jp/${linkId}` : '#',
        icon,
        id,
        linkId,
        name,
      };
    }
  }

  get series() {
    if (!this._rawData.series || !this._rawData.series.id) {
      return null;
    }
    const series = this._rawData.series;
    const thumbnailUrl = series.thumbnailUrl || this.betterThumbnail;
    return Object.assign({}, series, {thumbnailUrl});
  }

  get firstVideo() {
    return this.series ? this.series.video.first : null;
  }

  get prevVideo() {
    return this.series ? this.series.video.prev : null;
  }

  get nextVideo() {
    return this.series ? this.series.video.next : null;
  }

  get relatedVideoItems() {
    return this._relatedVideo.playlist || [];
  }

  get replacementWords() {
    return this._ngFilters.reduce((acc, ng) => {
      if (ng.source != null && ng.destination != null) {
        acc[ng.source] = ng.destination;
      }
      return acc;
    }, Object.create({}))
  }

  get playlistToken() {
    return this._playlistToken;
  }

  set playlistToken(v) {
    this._playlistToken = v;
  }

  get watchAuthKey() {
    return this._watchAuthKey;
  }

  set watchAuthKey(v) {
    this._watchAuthKey = v;
  }

  get seekToken() {
    return this._seekToken;
  }

  get width() {
    return parseInt(this._videoDetail.width, 10);
  }

  get height() {
    return parseInt(this._videoDetail.height, 10);
  }

  get initialPlaybackTime() {
    return this.resumePoints[0] && (this.resumePoints[0].time || 0);
  }

  get resumePoints() {
    const duration = this.duration;
    const MARGIN = 10;
    const resumePoints =
      ((this._cacheData && this._cacheData.resume) ? this._cacheData.resume : [])
        .filter(({now, time}) => time > MARGIN && time < duration - MARGIN)
        .map(({now, time}) => { return {now: new Date().toLocaleString(), time}; })
        .reverse();
    const lastResumePoint = this._resumeInfo ? this._resumeInfo.initialPlaybackPosition : 0;

    lastResumePoint && resumePoints.unshift({now: '前回', time: lastResumePoint});
    return resumePoints;
  }

  get csrfToken() {
    return this._rawData.csrfToken || '';
  }

  get extension() {
    if (this.isDomandAvailable || this.isDmcAvailable) {
      return 'mp4';
    }
    return 'unknown';
  }

  get community() {
    return this._rawData.community || null;
  }

  get maybeBetterQualityServerType() {
    if (this.isDomandOnly) {
      return 'domand';
    }
    if (this.isDmcOnly) {
      return 'dmc';
    }
    if (!this.isDmcAvailable) {
      return 'domand';
    }
    if (!this.isDomandAvailable) {
      return 'dmc';
    }

    const highestDomand = Math.max(...this.domandInfo.videos.map(v => {
      return v.height;
    }));

    const highestDmc = Math.max(...this.dmcInfo.videos.map(v => {
      return v.metadata.resolution.height;
    }));

    // Domandのほうが高解像度を持っているなら恐らくDomand側が高画質
    if (highestDomand >= highestDmc) {
      return 'domand';
    }

    // それ以外はdmc
    return 'dmc';
  }
}


//===END===

export {
  DmcInfo, VideoInfoModel, VideoFilter
};
