import {workerUtil} from '../infra/workerUtil';
import {StoryboardCacheDb} from './StoryboardCacheDb';
//===BEGIN===

const VideoSessionWorker = (() => {
  const func = function(self) {
    const SMILE_HEART_BEAT_INTERVAL_MS = 10 * 60 * 1000; // 10min
    const DMC_HEART_BEAT_INTERVAL_MS = 30 * 1000;      // 30sec

    const SESSION_CLOSE_FAIL_COUNT = 3;

    const VIDEO_QUALITY = {
      auto: "auto",
      veryhigh: "1080p",
      high: "720p",
      mid: "480p",
      low: "360p",
      verylow: "低画質",
    };

    const util = {
      fetch(url, params = {}) { // ブラウザによっては location.origin は 'blob:' しか入らない
        if (!location.origin.endsWith('.nicovideo.jp') && !new RegExp('^blob:https?://[a-z0-9]+\\.nicovideo\\.jp/').test(location.href)) {
          return self.xFetch(url, params);
        }
        const racers = [];
        let timer;

        const timeout = (typeof params.timeout === 'number' && !isNaN(params.timeout)) ? params.timeout : 30 * 1000;
        if (timeout > 0) {
          racers.push(new Promise((resolve, reject) =>
            timer = setTimeout(() => timer ? reject({name: 'timeout', message: 'timeout'}) : resolve(), timeout))
          );
        }

        const controller = AbortController ? (new AbortController()) : null;
        if (controller) {
          params.signal = controller.signal;
        }
        racers.push(fetch(url, params));
        return Promise.race(racers).catch(err => {
          if (err.name === 'timeout') {
            console.warn('request timeout', url, params);
            if (controller) {
              controller.abort();
            }
          }
          return Promise.reject(err.message || err);
        }).finally(() => timer = null);
      }
    };

    class DmcPostData {
      constructor(dmcInfo, videoQuality, {useHLS = true, useSSL = false}) {
        this._dmcInfo = dmcInfo;
        this._videoQuality = videoQuality || 'auto';
        this._useHLS = useHLS;
        this._useSSL = useSSL;
        this._useWellKnownPort = true;
      }

      toString() {
        let dmcInfo = this._dmcInfo;

        const label = VIDEO_QUALITY[this._videoQuality] || VIDEO_QUALITY.auto;
        let videos;
        if (label === VIDEO_QUALITY.auto) {
          videos = dmcInfo.availableVideoIds;
        } else {
          const { availableVideos } = dmcInfo;
          const video = availableVideos.find(v => label === v.metadata.label) ?? availableVideos[0];
          videos = [video.id]
        }

        const audio = dmcInfo.availableAudioIds[0];

        let contentSrcIdSets =
          (this._useHLS && label === VIDEO_QUALITY.auto)
          ? this._buildAbrContentSrcIdSets(videos, audio)
          : this._buildContentSrcIdSets(videos, audio);

        let http_parameters = {};
        let parameters = {
          use_ssl: this._useSSL ? 'yes' : 'no',
          use_well_known_port: this._useWellKnownPort ? 'yes' : 'no',
          transfer_preset: dmcInfo.transferPreset
        };
        if (this._useHLS) {
          parameters.segment_duration = 6000;//Config.getValue('video.hls.segmentDuration');
          if (dmcInfo.encryption){
            parameters.encryption = {
              hls_encryption_v1 : {
                encrypted_key : dmcInfo.encryption.encryptedKey,
                key_uri : dmcInfo.encryption.keyUri
              }
            };
          }
        } else if (!dmcInfo.protocols.includes('http')) {
          throw new Error('HLSに未対応');
        }
        http_parameters.parameters = this._useHLS ?
          {hls_parameters: parameters} :
          {http_output_download_parameters: parameters};

        const request = {
          session: {
            client_info: {
              player_id: dmcInfo.playerId
            },
            content_auth: {
              auth_type: dmcInfo.authTypes[this._useHLS ? 'hls' : 'http'] || 'ht2',
              content_key_timeout: dmcInfo.contentKeyTimeout,
              service_id: 'nicovideo',
              service_user_id: dmcInfo.serviceUserId,
              //max_content_count: 10,
            },
            content_id: dmcInfo.contentId,
            content_src_id_sets: contentSrcIdSets,
            content_type: 'movie',
            content_uri: '',
            keep_method: {
              heartbeat: {lifetime: dmcInfo.heartbeatLifetime}
            },
            priority: dmcInfo.priority,
            protocol: {
              name: 'http',
              parameters: {http_parameters}
            },
            recipe_id: dmcInfo.recipeId,

            session_operation_auth: {
              session_operation_auth_by_signature: {
                signature: dmcInfo.signature,
                token: dmcInfo.token
              }
            },

            timing_constraint: 'unlimited'
          }
        };

        return JSON.stringify(request, null, 2);
      }

      _buildContentSrcIdSets(videos, audio) {
        return [
          {
            content_src_ids: [
              {
                src_id_to_mux: {
                  audio_src_ids: [audio],
                  video_src_ids: videos
                }
              }
            ]
          }
        ];
      }

      _buildAbrContentSrcIdSets(videos, audio) {
        const v = videos.concat();
        const contentSrcIds = [];
        while (v.length > 0) {
          contentSrcIds.push({
            src_id_to_mux: {
              audio_src_ids: [audio],
              video_src_ids: v.concat()
            }
          });
          v.shift();
        }
        return [{content_src_ids: contentSrcIds}];
      }
    }


    class VideoSession {

      static create({serverType, ...params}) {
        switch (serverType) {
          case 'domand':
            return new DomandSession(params);
          case 'dmc':
            return new DmcSession(params);
          default:
            throw new Error('Unknown server type');
        }
      }

      constructor({videoInfo, videoQuality, useHLS}) {
        this._videoInfo = videoInfo;

        this._isPlaying = () => true;
        this._pauseCount = 0;
        this._failCount = 0;
        this._lastResponse = '';
        this._videoQuality = videoQuality || 'auto';
        this._videoSessionInfo = {};
        this._isDeleted = false;
        this._isAbnormallyClosed = false;

        this._heartBeatTimer = null;

        this._useSSL = true;
        this._useHLS = !!useHLS;
        this._useWellKnownPort = true;

        this._onHeartBeatSuccess = this._onHeartBeatSuccess.bind(this);
        this._onHeartBeatFail = this._onHeartBeatFail.bind(this);
      }

      async connect() {
        this._createdAt = Date.now();
        return await this._createSession();
      }

      enableHeartBeat() {
        this.disableHeartBeat();
        this._heartBeatTimer =
          setInterval(this._onHeartBeatInterval.bind(this), this._heartBeatInterval);
      }

      changeHeartBeatInterval(interval) {
        if (this._heartBeatTimer) {
          clearInterval(this._heartBeatTimer);
        }
        this._heartBeatInterval = interval;
        this._heartBeatTimer =
          setInterval(this._onHeartBeatInterval.bind(this), this._heartBeatInterval);
      }

      disableHeartBeat() {
        if (this._heartBeatTimer) {
          clearInterval(this._heartBeatTimer);
        }
        this._heartBeatTimer = null;
      }

      _onHeartBeatInterval() {
        if (this._isClosed) {
          return;
        }
        this._heartBeat();
      }

      _onHeartBeatSuccess() {}

      _onHeartBeatFail() {
        this._failCount++;
        if (this._failCount >= SESSION_CLOSE_FAIL_COUNT) {
          this._isAbnormallyClosed = true;
          this.close();
        }
      }

      async close() {
        this._isClosed = true;
        this.disableHeartBeat();
        return await this._deleteSession();
      }

      get serverType() {
        return 'unknown';
      }

      get info() {
        return {...this._videoSessionInfo, type: this.serverType};
      }

      set info({ url, sessionId, video, audioFormat, heartBeatUrl, deleteSessionUrl, lastResponse }) {
        this._videoSessionInfo = {
          url,
          sessionId,
          video,
          audioFormat,
          heartBeatUrl,
          deleteSessionUrl,
          lastResponse
        };
      }

      get isDomand() {
        return this.serverType === 'domand';
      }

      get isDmc() {
        return this.serverType === 'dmc';
      }

      get isDeleted() {
        return !!this._isDeleted;
      }

      get isAbnormallyClosed() {
        return this._isAbnormallyClosed;
      }
    }

    class DomandSession extends VideoSession {
      constructor(params) {
        super(params);
        this._expireTime = new Date();
        this._domandInfo = this._videoInfo.domandInfo;
      }

      async _createSession() {
        console.time('create Domand session');
        if (!this._useHLS) {
          throw new Error('HLSに未対応');
        }
        const { availableVideos } = this._domandInfo;
        const audioFormat = this._domandInfo.availableAudioIds[0];
        let videos, videoFormat, videoLabel;
        if (this._videoQuality === 'auto') {
          videos = this._domandInfo.availableVideoIds;
          const { id, label } = availableVideos[0];
          videoFormat = id;
          videoLabel = label;
        } else {
          const video = availableVideos.find(v => v.label === this._videoQuality) ?? availableVideos[0];
          videoFormat = video.id;
          videoLabel = video.label;
          videos = [videoFormat];
        }

        const query = new URLSearchParams({ actionTrackId: this._videoInfo.actionTrackId });
        const url = `https://nvapi.nicovideo.jp/v1/watch/${this._domandInfo.videoId}/access-rights/hls?${query.toString()}`;
        const result = await util.fetch(url, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            'X-Frontend-Id': 6,
            'X-Frontend-Version': '0',
            'X-Request-With': 'https://www.nicovideo.jp',
            'X-Access-Right-Key': this._domandInfo.accessRightKey,
          },
          credentials: 'include',
          body: JSON.stringify(this._buildOutputsMatrix(videos, audioFormat))
        }).then(res => res.json());
        if (result.meta.status == null || result.meta.status >= 300) {
          throw new Error('cannot create domand session', result)
        }

        this._lastResponse = result.data || {};
        const {
          contentUrl,
          // createTime,
          expireTime
        } = this._lastResponse;
        this._lastUpdate = Date.now();
        this._expireTime = new Date(expireTime);

        this.info = {
          url: contentUrl,
          video: {
            format: videoFormat,
            label: videoLabel,
          },
          audioFormat,
          lastResponse: result
        };
        console.timeEnd('create Domand session');
        return this.info;
      }

      async _deleteSession() {
        if (this._isDeleted) {
          return;
        }
        this._isDeleted = true;
      }

      get isDeleted() {
        if (this._isDeleted) {
          return true;
        }
        if (Date.now() > this._expireTime) {
          this._isDeleted = true;
        }
        return this._isDeleted;
      }

      get serverType() {
        return 'domand';
      }

      _buildOutputsMatrix(videoIds, audio) {
        return {
          outputs: videoIds.map(v => [v, audio]),
        }
      }
    }

    class DmcSession extends VideoSession {
      constructor(params) {
        super(params);

        this._heartBeatInterval = DMC_HEART_BEAT_INTERVAL_MS;
        this._onHeartBeatSuccess = this._onHeartBeatSuccess.bind(this);
        this._onHeartBeatFail = this._onHeartBeatFail.bind(this);
        this._lastUpdate = Date.now();
        this._heartbeatLifetime = this._heartBeatInterval;
        this._dmcInfo = this._videoInfo.dmcInfo;
      }

      _createSession() {
        const dmcInfo = this._dmcInfo;
        console.time('create DMC session');
        const baseUrl = (dmcInfo.urls.find(url => url.is_well_known_port === this._useWellKnownPort) || dmcInfo.urls[0]).url;
        return new Promise((resolve, reject) => {
          const url = `${baseUrl}?_format=json`;

          this._heartbeatLifetime = dmcInfo.heartbeatLifetime;
          const postData = new DmcPostData(dmcInfo, this._videoQuality, {
            useHLS: this.useHLS,
            useSSL: url.startsWith('https://'),
            useWellKnownPort: true
          });

          util.fetch(url, {
            method: 'post',
            timeout: 10000,
            dataType: 'text',
            body: postData.toString()
          }).then(res => res.json())
            .then(json => {
              const data = json.data || {}, session = data.session || {};
              const sessionId = session.id;
              const content_src_id_sets = session.content_src_id_sets;
              const {
                video_src_ids: [videoFormat],
                audio_src_ids: [audioFormat],
              } = content_src_id_sets[0].content_src_ids[0].src_id_to_mux;

              this._heartBeatUrl =
                `${baseUrl}/${sessionId}?_format=json&_method=PUT`;
              this._deleteSessionUrl =
                `${baseUrl}/${sessionId}?_format=json&_method=DELETE`;

              this._lastResponse = data;

              this._lastUpdate = Date.now();
              this.info = {
                url: session.content_uri,
                sessionId,
                video: {
                  format: videoFormat,
                  label: dmcInfo.availableVideos.find(v => videoFormat === v.id).metadata.label,
                },
                audioFormat,
                heartBeatUrl: this._heartBeatUrl,
                deleteSessionUrl: this._deleteSessionUrl,
                lastResponse: json
              };
              this.enableHeartBeat();
              console.timeEnd('create DMC session');
              resolve(this.info);
            }).catch(err => {
              console.error('create api fail', err);
              reject(err.message || err);
            });
        });
      }

      get useHLS() {
        return this._useHLS &&
          this._dmcInfo.protocols.includes('hls');
      }

      _heartBeat() {
        let url = this.info.heartBeatUrl;
        util.fetch(url, {
          method: 'post',
          dataType: 'text',
          timeout: 10000,
          body: JSON.stringify(this._lastResponse)
        }).then(res => res.json())
          .then(this._onHeartBeatSuccess)
          .catch(this._onHeartBeatFail);
      }

      _deleteSession() {
        if (this._isDeleted) {
          return Promise.resolve();
        }
        this._isDeleted = true;
        let url = this.info.deleteSessionUrl;
        return new Promise(res => setTimeout(res, 3000)).then(() => {
          return util.fetch(url, {
            method: 'post',
            dataType: 'text',
            timeout: 10000,
            body: JSON.stringify(this._lastResponse)
          });
        }).catch(err => console.error('delete fail', err));
      }

      _onHeartBeatSuccess(result) {
        let json = result;
        this._lastResponse = json.data;
        this._lastUpdate = Date.now();
      }

      get isDeleted() {
        return !!this._isDeleted || (Date.now() - this._lastUpdate) > this._heartbeatLifetime * 1.2;
      }

      get serverType() {
        return 'dmc';
      }
    }


    class StoryboardInfoLoader {
      static create({type, ...params}) {
        switch (type) {
          case 'domand':
            return new DomandStoryboardInfoLoader(params);
          case 'dmc':
            return new DmcStoryboardInfoLoader(params);
          default:
            throw new Error('Unknown server type');
        }
      }

      constructor({url}) {
        this._url = url;
        this._duration = 1;
      }

      async load() {
        throw new Error('not implemented');
      }

      get storyboard() {
        return {
          version: "1",
          thumbnail: {
            width: 160,
            height: 90,
          },
          columns: 1,
          rows: 1,
          interval: 1000,
          quality: 1,
          images: [{
            timestamp: 0,
            url: 'https://example.com'
          }],
        };
      }

      get duration() {
        return this._duration;
      }

      set duration(value) {
        this._duration = value;
      }

      async getStoryboardWithImages() {
        const fetchImages = this.storyboard.images.map(async image => {
          try {
            const res = await fetch(image.url);
            return {
              ...image,
              buffer: await res.arrayBuffer(),
            }
          } catch {
            return image;
          }
        });
        const count = Math.ceil(this.duration * 1000 / this.storyboard.interval);
        return {
          ...this.storyboard,
          count,
          images: await Promise.all(fetchImages),
        }
      }

      async _getInfo() {
        return {
          duration: this.duration,
          storyboard: await this.getStoryboardWithImages(),
        };
      }

      async getInfo() {
        return {
          ...await this._getInfo(),
          format: 'unknown',
        };
      }

      _toJSON() {
        return {
          duration: this.duration,
          storyboard: this.storyboard,
        };
      }

      toJSON() {
        return {
          ...this._toJSON(),
          format: 'unknown',
        };
      }
    }

    class DomandStoryboardInfoLoader extends StoryboardInfoLoader {
      constructor(params) {
        super(params);
        this._rawData = null;
      }

      async load() {
        try {
          const result = await util.fetch(this._url, {credentials: 'include'});
          this._rawData = await result.json();
        } catch {
          throw 'storyboard request fail';
        }
      }

      get storyboard() {
        if (this._rawData == null) {
          return null;
        }
        const {
          thumbnailWidth: width,
          thumbnailHeight: height,
          images,
          ...sbInfo
        } = this._rawData;
        return {
          ...sbInfo,
          thumbnail: {
            width,
            height,
          },
          images: images.map(image => {
            const url = new URL(this._url);
            const name = image.url;
            url.pathname = url.pathname.replace(/storyboard\.json$/, name);
            image.url = url.toString();
            return image;
          }),
        }
      }

      async getInfo() {
        return {
          ...await this._getInfo(),
          format: 'domand',
        };
      }

      toJSON() {
        return {
          ...this._toJSON(),
          format: 'domand',
        };
      }
    }

    class DmcStoryboardInfoLoader extends StoryboardInfoLoader {
      constructor(params) {
        super(params);
        this._rawData = null;
      }

      async load() {
        const result = await util.fetch(this._url, {credentials: 'include'}).then(res => res.json());
        if (result.meta.status && result.meta.status >= 300) {
          throw 'storyboard request fail';
        }
        this._rawData = result.data;
        return;
      }

      get _storyboards() {
        const {storyboards = [], version = 0} = this._rawData ?? {};
        const ver = version.toString();
        return storyboards.map(sb => {
          const images = sb.images.map(img => {
            return {
              timestamp: img.timestamp,
              url: img.uri,
            }
          })
          return {
            version: ver,
            thumbnail: {
              width: sb.thumbnail_width,
              height: sb.thumbnail_height,
            },
            columns: sb.columns,
            rows: sb.rows,
            interval: sb.interval,
            quality: sb.quality,
            images,
          }
        }).toSorted((a, b) => b.quality < a.quality);
      }

      get storyboard() {
        if (this._storyboards.length > 0) {
          return this._storyboards[0];
        }

        return null;
      }

      async getInfo() {
        return {
          ...await this._getInfo(),
          format: 'dmc',
        };
      }

      toJSON() {
        return {
          ...this._toJSON(),
          format: 'dmc',
        };
      }
    }

    class StoryboardSession {
      static create({serverType, ...params}) {
        switch (serverType) {
          case 'domand':
            return new DomandStoryboardSession(params);
          case 'dmc':
            return new DmcStoryboardSession(params);
          default:
            throw new Error('Unknown server type');
        }
      }

      constructor({videoInfo}) {
        this._videoInfo = videoInfo;
      }

      async create() {
        return await this._createSession();
      }
    }

    class DomandStoryboardSession extends StoryboardSession {
      constructor(params) {
        super(params);
        this._info = this._videoInfo.domandInfo;
      }

      async _createSession() {
        const query = new URLSearchParams({ actionTrackId: this._videoInfo.actionTrackId });
        const url = `https://nvapi.nicovideo.jp/v1/watch/${this._info.videoId}/access-rights/storyboard?${query.toString()}`;
        try {
          const result = await util.fetch(url, {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'X-Frontend-Id': 6,
              'X-Frontend-Version': '0',
              'X-Request-With': 'https://www.nicovideo.jp',
              'X-Access-Right-Key': this._info.accessRightKey,
            },
            credentials: 'include',
          }).then(res => res.json());
          if (result.meta.status && result.meta.status >= 300) {
            throw 'api_not_exist';
          }
          return this._toSessionInfo(result.data);
        } catch (err) {
          if (err === 'api_not_exist') {
            throw 'Domand storyboard api not exist';
          }
          console.error('create domand session fail', err);
          throw 'create domand session fail';
        }
      }

      _toSessionInfo({contentUrl: url}) {
        return {
          type: 'domand',
          url,
        };
      }
    }

    class DmcStoryboardSession extends StoryboardSession {
      constructor(params) {
        super(params);
        this._info = this._videoInfo.dmcStoryboardInfo;
        this._url = this._info.urls[0].url;
      }

      async _createSession() {
        const url = `${this._url}?_format=json`;
        const body = this._createRequestString();
        try {
          const result = await util.fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body
          }).then(res => res.json());
          if (result.meta.status && result.meta.status >= 300 || !result.data?.session?.content_uri) {
            throw 'api_not_exist';
          }
          return this._toSessionInfo(result.data);
        } catch (err) {
          if (err === 'api_not_exist') {
            throw 'DMC storyboard api not exist';
          }
          console.error('create dmc session fail', err);
          throw 'create dmc session fail';
        }
      }

      _createRequestString() {
        const info = this._info;

        // 階層が深くて目が疲れた
        const request = {
          session: {
            client_info: {
              player_id: info.playerId
            },
            content_auth: {
              auth_type: info.authTypes.storyboard,
              content_key_timeout: info.contentKeyTimeout,
              service_id: 'nicovideo',
              service_user_id: info.serviceUserId,
            },
            content_id: info.contentId,
            content_src_id_sets: [{
              content_src_ids: info.videos
            }],
            content_type: 'video',
            content_uri: '',
            keep_method: {
              heartbeat: {
                lifetime: info.heartbeatLifetime
              }
            },
            priority: info.priority,
            protocol: {
              name: 'http',
              parameters: {
                http_parameters: {
                  parameters: {
                    storyboard_download_parameters: {
                      use_well_known_port: 'yes',
                      use_ssl: 'yes'
                    }
                  }
                }
              }
            },
            recipe_id: info.recipeId,
            session_operation_auth: {
              session_operation_auth_by_signature: {
                signature: info.signature,
                token: info.token
              }
            },
            timing_constraint: 'unlimited'
          }
        };

        //console.log('storyboard session request', JSON.stringify(request, null, ' '));
        return JSON.stringify(request);
      }

      _toSessionInfo({session: {content_uri: url}}) {
        return {
          type: 'dmc',
          url,
        };
      }
    }


    const SESSION_ID = Symbol('SESSION_ID');
    const getSessionId = function() { return `session_${this.id++}`; }.bind({id: 0});

    let current = null;
    const create = async (params) => {
      if (current) {
        current.close();
        current = null;
      }
      current = await VideoSession.create(params);
      const sessionId = getSessionId();
      current[SESSION_ID] = sessionId;

      // console.log('create', sessionId, current[SESSION_ID]);
      return {
        serverType: current.serverType,
        isDomand: current.isDomand,
        isDmc: current.isDmc,
        sessionId
      };
    };

    const connect = async () => {
      // console.log('connect', sessionId, current[SESSION_ID]);
      return current.connect();
    };

    const getState = () => {
      if (!current) {
        return {};
      }
      // console.log('getState', sessionId, current[SESSION_ID]);
      return {
        serverType: current.serverType,
        isDomand: current.isDomand,
        isDmc: current.isDmc,
        isDeleted: current.isDeleted,
        isAbnormallyClosed: current.isAbnormallyClosed,
        sessionId: current[SESSION_ID]
      };
    };

    const close = () => {
      // current && console.log('close', sessionId, current[SESSION_ID]);
      current && current.close();
      current = null;
    };

    const storyboard = async ({videoInfo, serverType}) => {
      const sbSessionInfo = await StoryboardSession.create({videoInfo, serverType}).create();
      const loader = StoryboardInfoLoader.create(sbSessionInfo);
      loader.duration = videoInfo.duration;
      await loader.load();
      try {
        const sbInfo = await loader.getInfo();
        return {
          ...sbInfo,
          status: 'ok',
          watchId: videoInfo.watchId,
        };
      } catch {
        return {
          watchId: videoInfo.watchId,
          status: 'fail',
        }
      }
    };

    self.onmessage = async ({command, params}) => {
      switch (command) {
        case 'create':
          return create(params);
        case 'connect':
          return await connect();
        case 'getState':
          return getState();
        case 'close':
          return close();
        case 'storyboard':
          return await storyboard(params);
      }
    };
  };

  let worker;
  const initWorker = () => {
    if (worker) { return worker; }
    worker = worker || workerUtil.createCrossMessageWorker(func, {name: 'VideoSessionWorker'});
  };
  const create = async ({videoInfo, videoQuality, serverType, useHLS}) => {
    await initWorker();
    const params = {
      videoInfo: videoInfo.toJSON(),
      videoQuality,
      serverType,
      useHLS
    };
    const result = await worker.post({command: 'create', params});
    const sessionId = result.sessionId;
    return Object.assign(result, {
      connect: () => worker.post({command: 'connect', params: {sessionId}}),
      getState: () => worker.post({command: 'getState', params: {sessionId}}),
      close: () => worker.post({command: 'close', params: {sessionId}})
    });
  };

  const storyboard = async ({type, info}) => {
    const videoInfo = info.toJSON();
    const cacheId = `${videoInfo.watchId}_${type}`;
    const cache = await StoryboardCacheDb.get(cacheId);
    if (cache) {
      return cache;
    }
    await initWorker();
    const params = {videoInfo, serverType: type};
    const result = await worker.post({command: 'storyboard', params});
    StoryboardCacheDb.put(cacheId, result);
    return result;
  };

  return {initWorker, create, storyboard};
})();

//===END===

export {VideoSessionWorker};
