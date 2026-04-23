import {PopupMessage} from '../util';
import {sleep} from '../../packages/lib/src/infra/sleep';
import {netUtil} from '../../../lib/src/infra/netUtil';

const debug = {};

//===BEGIN===

const {ThreadLoader} = (() => {
  const FRONT_ID = '6';
  const FRONT_VER = '0';

  const FORK_LABEL = {
    0: 'main',
    1: 'owner',
    2: 'easy',
    3: 'ai',
  }

  class ThreadLoader {

    constructor() {
      this._threadKeys = {};
    }

    async getThreadKey(videoId, options = {}) {
      let url = `https://nvapi.nicovideo.jp/v1/comment/keys/thread?videoId=${videoId}`;

      console.log('getThreadKey url: ', url);
      try {
        const { meta, data } = await netUtil.fetch(url, {
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
          },
          credentials: 'include'
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta
        }
        this._threadKeys[videoId] = data.threadKey;
        return data
      } catch (result) {
        throw { result, message: `ThreadKeyの取得失敗 ${videoId}` }
      }
    }

    async getPostKey(threadId, options = {}) {
      const url = `https://nvapi.nicovideo.jp/v1/comment/keys/post?threadId=${threadId}`;

      console.log('getPostKey url: ', url);
      try {
        const { meta, data } = await netUtil.fetch(url, {
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
          },
          credentials: 'include'
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta
        }
        return data
      } catch (result) {
        throw { result, message: `PostKeyの取得失敗 ${threadId}` }
      }
    }

    async _delete(url, body, options = {}) {
      try {
        const { meta } = await netUtil.fetch(url, {
          method: 'PUT',
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
            'Content-Type': 'text/plain; charset=UTF-8'
          },
          body
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta
        }
      } catch (result) {
        throw {
          result,
          message: `コメントの通信失敗`
        }
      }
    }

    async _post(url, body, options = {}) {
      try {
        const { meta, data } = await netUtil.fetch(url, {
          method: 'POST',
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
            'Content-Type': 'text/plain; charset=UTF-8'
          },
          body
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta
        }
        return data;
      } catch (result) {
        throw {
          result,
          message: `コメントの通信失敗`
        }
      }
    }

    async _load(msgInfo, options = {}) {
      const {
        params,
        server,
        threadKey
      } = msgInfo.nvComment;

      const packet = {
        additionals: {},
        params,
        threadKey
      };

      if (options.retrying) {
        const info = await this.getThreadKey(msgInfo.videoId, options);
        console.log('threadKey: ', msgInfo.videoId, info);
        packet.threadKey = info.threadKey;
      }

      if (msgInfo.language !== params.language) {
        packet.params.language = msgInfo.language;
      }

      if (msgInfo.when > 0) {
        packet.additionals.when = msgInfo.when;
      }

      const url = new URL('/v1/threads', server);
      console.log('load threads...', url, packet);
      try {
        const { meta, data } = await netUtil.fetch(url, {
          method: 'POST',
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
            'Content-Type': 'text/plain; charset=UTF-8'
          },
          body: JSON.stringify(packet)
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta;
        }
        return data;
      } catch (result) {
        throw {
          result,
          message: `コメントの通信失敗`
        }
      }
    }

    async load(msgInfo, options = {}) {
      const { videoId, userId } = msgInfo;

      const timeKey = `loadComment videoId: ${videoId}`;
      console.time(timeKey);

      let result;
      try {
        result = await this._load(msgInfo, options);
      } catch (e) {
        console.timeEnd(timeKey);
        window.console.error('loadComment fail 1st: ', e);
        PopupMessage.alert('コメントの取得失敗: 3秒後にリトライ');

        await sleep(3000);
        try {
          console.time(timeKey);
          result = await this._load(msgInfo, { retrying: true, ...options });
        } catch (e) {
          console.timeEnd(timeKey);
          window.console.error('loadComment fail finally: ', e);
          throw {
            message: 'コメントサーバーの通信失敗'
          }
        }
      }

      console.timeEnd(timeKey);
      debug.lastMessageServerResult = result;

      let totalResCount = result.globalComments.reduce((count, current) => (count + current.count), 0);
      for (const thread of result.threads) {
        const fork = thread.fork;
        thread.info = msgInfo.threads.find(({id, forkLabel}) => `${id}` === thread.id && forkLabel === fork);
        // 投稿者コメントはGlobalにカウントされていない
        if (fork === 'easy') {
          // かんたんコメントをカウントしていない挙動に合わせる。不要？
          const resCount = thread.commentCount;
          totalResCount -= resCount;
        }
      }

      const threadInfo = {
        userId,
        videoId,
        threadId: msgInfo.threadId,
        is184Forced: msgInfo.defaultThread.is184Forced,
        totalResCount,
        language: msgInfo.language,
        when: msgInfo.when,
        isWaybackMode: !!msgInfo.when
      };

      msgInfo.threadInfo = threadInfo;

      console.log('threadInfo: ', threadInfo);
      return {threadInfo, body: result, format: 'threads'};
    }

    async postChat(msgInfo, text, cmd, vpos, retrying = false) {
      const {
        videoId,
        threadId,
        language
      } = msgInfo.threadInfo;
      const url = new URL(`/v1/threads/${threadId}/comments`, msgInfo.nvComment.server);
      const { postKey } = await this.getPostKey(threadId, { language });

      const packet = JSON.stringify({
        body: text,
        commands: cmd?.split(/[\x20\xA0\u3000\t\u2003\s]+/) ?? [],
        vposMs: Math.floor((vpos || 0) * 10),
        postKey,
        videoId,
      });
      console.log('post packet: ', packet);
      try {
        const { no, id } = await this._post(url, packet);
        return {
          status: 'ok',
          no,
          id,
          message: 'コメント投稿成功'
        };
      } catch (error) {
        const { result: { status: statusCode, errorCode } } = error;
        if (statusCode == null) {
          throw {
            status: 'fail',
            message: `コメント投稿失敗`
          };
        }
        if (!retrying && ['INVALID_TOKEN', 'EXPIRED_TOKEN'].includes(errorCode)) {
          await this.load(msgInfo);
        } else {
          throw {
            status: 'fail',
            statusCode,
            message: errorCode ? `コメント投稿失敗 ${errorCode}` : 'コメント投稿失敗'
          };
        }
        await sleep(3000);
        return await this.postChat(msgInfo, text, cmd, vpos, true)
      }
    }

    async getDeleteKey(threadId, options = {}) {
      const url = `https://nvapi.nicovideo.jp/v1/comment/keys/delete?threadId=${threadId}&fork=${options.fork || 'main'}`;

      console.log('getNicoruKey url: ', url);
      try {
        const { meta, data } = await netUtil.fetch(url, {
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
            'X-Niconico-Language': options.language || 'ja-jp'
          },
          credentials: 'include'
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta
        }
        return data
      } catch (result) {
        throw { result, message: `DeleteKeyの取得失敗 ${threadId}` }
      }
    }

    async deleteChat(msgInfo, chat) {
      const {
        videoId,
        threadId,
        language
      } = msgInfo.threadInfo;
      const url = new URL(`/v1/threads/${threadId}/comment-comment-owner-deletions`, msgInfo.nvComment.server);
      const fork = FORK_LABEL[chat.fork || 0];
      const { deleteKey } = await this.getDeleteKey(threadId, { language, fork });
      const packet = JSON.stringify({
        deleteKey,
        fork,
        language,
        targets: [{
          no: chat.no,
          operation: 'DELETE'
        }],
        videoId,
      });
      console.log('put packet: ', packet);
      try {
        await this._delete(url, packet);
        return {
          status: 'ok',
          message: 'コメント削除成功'
        };
      } catch (error) {
        const { result: { status: statusCode, errorCode } } = error;
        throw {
          status: 'fail',
          statusCode,
          message: errorCode ? `コメント削除失敗 ${errorCode}` : 'コメント削除失敗'
        };
      }
    }

    async getNicoruKey(threadId, options = {}) {
      const url = `https://nvapi.nicovideo.jp/v1/comment/keys/nicoru?threadId=${threadId}`;

      console.log('getNicoruKey url: ', url);
      try {
        const { meta, data } = await netUtil.fetch(url, {
          headers: {
            'X-Frontend-Id': FRONT_ID,
            'X-Frontend-Version': FRONT_VER,
            'X-Niconico-Language': options.language || 'ja-jp'
          },
          credentials: 'include'
        }).then(res => res.json());
        if (meta.status >= 300) {
          throw meta
        }
        return data
      } catch (result) {
        throw { result, message: `NicoruKeyの取得失敗 ${threadId}` }
      }
    }

    async nicoru(msgInfo, chat) {
      const {
        videoId,
        threadId,
        language
      } = msgInfo.threadInfo;
      const url = new URL(`/v1/threads/${threadId}/nicorus`, msgInfo.nvComment.server);
      const { nicoruKey } = await this.getNicoruKey(threadId, { language });
      const packet = JSON.stringify({
        content: chat.text,
        fork: FORK_LABEL[chat.fork || 0],
        no: chat.no,
        nicoruKey,
        videoId,
      });
      console.log('post packet: ', packet);
      try {
        const { nicoruId, nicoruCount } = await this._post(url, packet);
        return {
          status: 'ok',
          id: nicoruId,
          count: nicoruCount,
          message: 'ニコれた'
        };
      } catch (error) {
        const { result: { status: statusCode, errorCode } } = error;
        throw {
          status: 'fail',
          statusCode,
          message: errorCode ? `ニコれなかった＞＜ ${errorCode}` : 'ニコれなかった＞＜'
        };
      }
    }
  }

  return {ThreadLoader: new ThreadLoader};
})();




//===END===

export {ThreadLoader};
