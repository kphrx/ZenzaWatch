import {netUtil} from '../infra/netUtil';
import {textUtil} from '../text/textUtil';
import {nicoUtil} from '../nico/nicoUtil';
import {Emitter} from '../Emitter';
import {CacheStorage} from '../infra/CacheStorage';

const Config = {
  getValue: () => {}
};

const emitter = new Emitter();
const debug = {};

//===BEGIN===
const VideoInfoLoader = (function () {
  const cacheStorage = new CacheStorage(sessionStorage);

  const parseWatchV3ApiData = (json) => {
    const _data = json.data.response;
    if (_data == null) {
      return
    }

    const {
      // ads,
      // baseVideo,
      // category,
      channel, // nullable
      client: {
        // nicosid,
        watchId,
        watchTrackId,
      },
      comment: {
        server: {
          url: commentServer,
        },
        keys: {
          userKey,
        },
        layers,
        threads,
        ng: {
          // ngScore,
          channel: channelNg,
          owner: ownerNg,
          // viewer,
        },
        // isAttentionRequired,
        nvComment,
        // assist,
        community, // nullable
      },
      // easyComment,
      external: {
        commons: {
          hasContentTree,
        },
        // ichiba,
      },
      genre: {
        key: genreKey,
        // label,
        // isImmoral,
        // isDisabled,
        // isNotSet,
      },
      // marquee,
      media: {
        domand: domandInfo, // nullable
        // delivery, // nullable
        // deliveryLegacy,
      },
      // okReason,
      owner, // nullable
      payment: {
        video: {
          isPpv: isNeedPayment,
          isAdmission: isMemberFree,
          isContinuationBenefit: isMemberContinued,
          isPremium: isPremiumFree,
          // watchableUserType,
          // commentableUserType,
          // billingType,
        },
        // preview,
      },
      // pcWatchPage,
      player: {
        initialPlayback, // nullable
        // comment,
        // layerMode,
      },
      // ppv,
      // ranking,
      series,
      // smartphone,
      // system,
      tag: {
        items: tags,
        // hasR18Tag,
        // isPublishedNicoscript,
        edit: tagEdit,
        // viewer,
      },
      video: {
        id: videoId,
        // contentType,
        title,
        description,
        count: {
          view: viewCount,
          comment: commentCount,
          mylist: mylistCount,
          like: likeCount,
        },
        duration,
        thumbnail: {
          url: thumbnail,
          // middleUrl,
          largeUrl: thumbnailUrl, // null
          player: largeThumbnail,
          // ogp,
          // short,
        },
        // rating,
        registeredAt,
        // isPrivate,
        // isDeleted,
        // isNoBanner,
        // isAuthenticationRequired,
        // isEmbedPlayerAllowed,
        // isGiftAllowed,
        viewer: videoStatusForViewer, // nullable
        // watchableUserTypeForPayment,
        // commentableUserTypeForPayment,
        // hasLyrics,
        // 9d091f87, // version hash?
      },
      // videoAds,
      // videoLive,
      viewer, // nullable
      // waku,
      // pcweb
    } = _data;

    const threadsWithLayer = threads.map(thread => {
      return {
        ...thread,
        layer: layers.find(({threadIds}) => {
          return threadIds.some(({id, fork}) => id === thread.id && fork === thread.fork);
        })
      }
    });
    const defaultThread = threadsWithLayer.find(t => t.isDefaultPostTarget);
    const resumeInfo = {
      type: initialPlayback?.type ?? '',
      positionSec: initialPlayback?.positionSec ?? 0,
    };
    const {
      // isOwner,
      like: {
        isLiked = false,
        // count,
      },
    } = videoStatusForViewer;
    const viewerInfo = {
      id: viewer?.id ?? 0,
      // nickname,
      isPremium: viewer?.isPremium ?? false,
      // allowSensitiveContents,
      // existence,
    };

    return {
      _version: "3",
      _data,
      channel,
      client: {
        watchId,
        watchTrackId,
      },
      comment: {
        server: commentServer,
        userKey,
        threads: threadsWithLayer,
        nvComment,
        defaultThread,
        ng: channelNg.concat(ownerNg),
      },
      community,
      external: {
        commons: {
          hasContentTree,
        },
      },
      genre: {
        key: genreKey,
      },
      owner: {
          name: owner.nickname,
          ...owner
      },
      payment: {
        isNeedPayment,
        isMemberFree,
        isMemberContinued,
        isPremiumFree,
      },
      series,
      tags,
      tagEdit,
      video: {
        id: videoId,
        title,
        description,
        count: {
          view: viewCount,
          comment: commentCount,
          mylist: mylistCount,
          like: likeCount,
        },
        duration,
        thumbnail: {
          normal: thumbnail,
          large: thumbnailUrl,
          player: largeThumbnail,
        },
        registeredAt,
        isLiked,
      },
      domandInfo,
      viewerInfo,
      resumeInfo,
    };
  };

  const parseWatchV4ApiData = (json) => {
    const _data = json.data.response.$watchV4?.data;
    if (_data == null) {
      return
    }

    const {
      client: {
        // nicosid,
        watchId,
        watchTrackId,
      },
      comment: {
        // assist,
        layers,
        ng: {
          // ngScore,
          owner: ngFilters,
          // viewer,
        },
        nvComment,
        threads,
      },
      genre: {
        // isDisabled,
        // isImmoral,
        // isNotSet,
        key: genreKey,
        // label,
      },
      media, // nullable
      // okReason,
      metadata: {
        jsonLd: {
          owner: ownerInfo,
          // videoObject,
        },
        // gtm,
      },
      // preview,
      payment: {
        ppv: {
          isEnabled: isNeedPayment,
          // showPromotion,
        },
        admission: {
          isEnabled: isMemberFree,
          // showPromotion,
        },
        continuationBenefit: {
          isEnabled: isMemberContinued,
          // showPromotion,
        },
        premium: {
          isEnabled: isPremiumFree,
          // showPromotion,
        },
        // watchableUserType,
        // commentableUserType,
        // billingType,
      },
      // baseVideo,
      player: {
        // comment,
        initialPlayback, // nullable
        // layerMode,
      },
      lazy: {
        authKey: additionalInfoKey,
      },
      // system,
      tags: {
        edit: tagEdit,
        // hasR18Tag,
        // isPublishedNicoscript,
        items: tags,
        // viewer,
      },
      video: {
        count: {
          comment: commentCount,
          like: likeCount,
          mylist: mylistCount,
          view: viewCount,
        },
        description,
        // supplements,
        duration,
        id: videoId,
        // contentType,
        permission: {
          isPrivate,
          isDeleted,
          isAuthenticationRequired,
          isEmbedPlayerAllowed,
          isGiftAllowed,
          // isNgForVocacolleApp,
          // rating,
        },
        registeredAt,
        thumbnail: {
          large: thumbnailUrl, // null
          // middle,
          // ogp,
          normal: thumbnail,
          player: largeThumbnail,
          // short,
        },
        title,
        viewer: videoStatusForViewer, // nullable
        isLikedByViewer: isLiked,
      },
      // videoAds,
      // videoLive,
      viewer, // nullable
    } = _data;

    const threadsWithLayer = threads.map(thread => {
      return {
        ...thread,
        layer: layers.find(({components}) => {
          return components.some(({threadId, fork}) => threadId === thread.id && fork === thread.fork);
        })
      }
    });
    const defaultThread = threadsWithLayer.find(t => t.isPostTarget);
    const resumeInfo = {
      type: initialPlayback?.type ?? '',
      positionSec: initialPlayback?.positionSec ?? 0,
    };
    const viewerInfo = {
      id: viewer?.id ?? 0,
      isPremium: viewer?.isPremium ?? false,
    };
    const {
      contents: domandContent,
      ...domandInfo
    } = media;

    return {
      _version: "4",
      _data,
      client: {
        watchId,
        watchTrackId,
      },
      comment: {
        nvComment,
        threads: threadsWithLayer,
        defaultThread,
        ng: ngFilters,
      },
      genre: {
        key: genreKey,
      },
      owner: ownerInfo,
      payment: {
        isNeedPayment,
        isMemberFree,
        isMemberContinued,
        isPremiumFree,
      },
      lazy: {
        authKey: additionalInfoKey,
      },
      tags,
      tagEdit,
      video: {
        count: {
          comment: commentCount,
          like: likeCount,
          mylist: mylistCount,
          view: viewCount,
        },
        description,
        duration,
        id: videoId,
        permission: {
          isPrivate,
          isDeleted,
          isAuthenticationRequired,
          isEmbedPlayerAllowed,
          isGiftAllowed,
        },
        registeredAt,
        thumbnail: {
          normal: thumbnail,
          large: thumbnailUrl,
          player: largeThumbnail,
        },
        title,
        isLiked,
      },
      domandInfo: {
        ...domandContent,
        ...domandInfo,
      },
      viewerInfo,
      resumeInfo,
    };
  };

  const loadWatchV4Lazy = ({videoId, token, trackId}) => {
    const url = `https://nvapi.nicovideo.jp/v4/watch/lazy/${videoId}`;
    return new Promise(r => {
      setTimeout(r, 1000);
    }).then(() => netUtil.fetch(url, {
      method: 'POST',
      headers: {
        'X-Frontend-Id': 6,
        'X-Frontend-Version': 0,
        'X-Niconico-Language': 'ja-jp',
        'X-Request-With': 'https://www.nicovideo.jp',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        actionTrackId: trackId,
        keyToken: token,
      }),
    }))
      .then(res => res.json())
      .then(json => json.data)
      .catch(() => {
        return Promise.reject({
          reason: 'network',
          message: '通信エラー(loadWatchV4Lazy)',
        });
      });
  };

  const parseWatchApiData = async (json) => {
    const _data = parseWatchV4ApiData(json) ?? parseWatchV3ApiData(json);
    if (_data == null) {
      throw {
        reason: 'network',
        message: '通信エラー。動画情報の取得に失敗しました。(watch api)'
      };
    }

    if (_data._version === "4") {
      _data._lazy = await loadWatchV4Lazy({
        videoId: _data.video.id,
        token: _data.lazy.authKey,
        trackId: _data.client.watchTrackId,
      });
      _data.series = _data._lazy.series;
    }

    const csrfToken = null;
    const watchAuthKey = null;

    cacheStorage.setItem('csrfToken', csrfToken, 30 * 60 * 1000);

    const msgInfo = {
      server: _data.comment.server,
      threadId: _data.comment.defaultThread.id,
      duration: _data.video.duration,
      videoId: _data.video.id,
      nvComment: _data.comment.nvComment,
      userId: _data.viewerInfo.id,
      defaultThread: _data.comment.defaultThread,
      threads: _data.comment.threads,
      userKey: _data.comment.userKey,
      when: null,
      frontendId: 6,
      frontendVersion: 0
    };

    const isDomand = _data.domandInfo != null;

    const tagList = _data.tags.map(tag => {
      const {
        // isCategory, // カテゴリ廃止
        // isCategoryCandidate,
        isLocked,
        isNicodicArticleExists,
        name,
      } = tag;
      return {
        _data: tag,
        isLocked,
        isNicodicArticleExists,
        name,
      }
    });

    const watchApiData = {
      videoDetail: {
        v: _data.client.watchId,
        id: _data.video.id,
        title: _data.video.title,
        // title_original: _data.video.originalTitle,
        description: _data.video.description,
        // description_original: _data.video.originalDescription,
        postedAt: _data.video.registeredAt,
        thumbnail: _data.video.thumbnail.normal,
        largeThumbnail: _data.video.thumbnail.player,
        length: _data.video.duration,

        commons_tree_exists: _data.external?.commons?.hasContentTree ?? true,

        // width: _data.video.width, // dmcInfo?.movie.videos[0].metadata.resolution.width
        // height: _data.video.height, // dmcInfo?.movie.videos[0].metadata.resolution.height

        isChannel: _data.owner?.type === "channel" || _data.channel != null,
        isMymemory: false,
        communityId: _data.community?.id ?? null,
        isLiked: _data.video.isLiked,

        commentCount: _data.video.count.comment,
        likeCount: _data.video.count.like,
        mylistCount: _data.video.count.mylist,
        viewCount: _data.video.count.view,

        tagList,
        tagEdit: _data.tagEdit,
      },
      viewerInfo: _data.viewerInfo,
      ownerInfo: _data.owner,
      additionalInfoKey: _data.lazy?.authKey,
      clientTrackId: _data.client.watchTrackId,
    };

    const result = {
      _format: 'html5watchApi',
      _data,
      watchApiData,
      domandInfo: _data.domandInfo,
      msgInfo,
      playlist: {
        playlist: [],
      },
      isPlayable: isDomand,
      isDomand,
      isDmc: false,
      thumbnailUrl: _data.video.thumbnail.large,
      csrfToken,
      watchAuthKey,
      genreKey: _data.genre.key,
      series: _data.series,
      ngFilters: _data.comment.ng,

      isMemberFree: _data.payment.isMemberFree,
      isMemberContinued: _data.payment.isMemberContinued,
      isNeedPayment: _data.payment.isNeedPayment,
      isPremiumFree: _data.payment.isPremiumFree,
      linkedChannelVideo: null,
      resumeInfo: _data.resumeInfo,
    };

    emitter.emitAsync('csrfTokenUpdate', csrfToken);
    return result;
  };

  const loadLinkedChannelVideoInfo = (originalData) => {
    const linkedChannelVideo = originalData.linkedChannelVideo;
    const originalVideoId = originalData.watchApiData.videoDetail.id;
    const videoId = linkedChannelVideo.linkedVideoId;

    if (originalVideoId === videoId) {
      originalData.linkedChannelVideo = null;
      return Promise.reject();
    }

    const url = `https://www.nicovideo.jp/watch/${videoId}?responseType=json`;
    window.console.info('%cloadLinkedChannelVideoInfo', 'background: cyan', linkedChannelVideo);
    return new Promise(r => {
      setTimeout(r, 1000);
    }).then(() => netUtil.fetch(url, {
      credentials: 'include',
    }))
      .then(res => res.json())
      .then(async json => {
        const data = await parseWatchApiData(json);
        //window.console.info('linkedChannelData', data);
        originalData.domandInfo = data.domandInfo;
        originalData.isPlayable = data.isPlayable;
        originalData.isDmc = data.isDmc;
        originalData.isDomand = data.isDomand;
        return originalData;
      })
      .catch(() => {
        originalData.linkedChannelVideo = null;
        return Promise.reject({
          reason: 'network',
          message: '通信エラー(loadLinkedChannelVideoInfo)',
        });
      });
  };

  const onLoadPromise = async (watchId, options, isRetry, resp) => {
    const data = await parseWatchApiData(resp);
    debug.watchApiData = data;

    if (data.isPlayable) {
      emitter.emitAsync('loadVideoInfo', data, 'WATCH_API', watchId);
      return data;
    }

    if (data.isNeedPayment && data.genreKey === 'anime' && Config.getValue('loadLinkedChannelVideo')) {
      const query = new URLSearchParams({
        videoId: data.watchApiData.videoDetail.id,
        _frontendId: data.msgInfo.frontendId,
      });
      const url = `https://public-api.ch.nicovideo.jp/v1/user/channelVideoDAnimeLinks?${query.toString()}`;
      const linkedChannelVideos = await netUtil.fetch(url, {
        credentials: 'include',
      })
        .then(r => r.json())
        .catch(() => ({}));
      data.linkedChannelVideo = linkedChannelVideos.data?.items?.find(ch => {
        return !!ch.isChannelMember;
      });
      if (data.linkedChannelVideo != null) {
        return await loadLinkedChannelVideoInfo(data);
      }
    }

    const error = (({isMemberFree, isMemberContinued, isNeedPayment, isPremiumFree}) => {
      if (!isNeedPayment && isPremiumFree) {
        return {
          reason: 'premium only',
          message: 'プレミアム会員限定',
        };
      }
      if (!isNeedPayment && isMemberFree && isMemberContinued) {
        return {
          reason: 'member continuation benefit',
          message: 'CH会員継続特典',
        };
      }
      if (!isNeedPayment && isMemberFree) {
        return {
          reason: 'member only',
          message: 'CH会員限定',
        };
      }
      if (!isNeedPayment) {
        return {
          reason: 'not supported',
          message: 'この動画はZenzaWatchで再生できません',
        };
      }
      let err = {
        reason: 'need payment',
        message: 'この動画は有料です',
      };
      if (isPremiumFree) {
        err.message += ' (プレミアム会員無料)';
      }
      if (isMemberFree) {
        err.message += ' (CH会員無料)';
      }
      return err;
    })(data);
    throw {
      ...error,
      info: data,
    };
  };

  const createSleep = function (sleepTime) {
    return new Promise(resolve => setTimeout(resolve, sleepTime));
  };

  const loadPromise = function (watchId, options, isRetry = false) {
    let url = `https://www.nicovideo.jp/watch/${watchId}`;
    console.log('%cloadFromWatchApiData...', 'background: lightgreen;', watchId, url);
    const query = ['responseType=json'];
    if (options.economy === true) {
      query.push('eco=1');
    }
    if (query.length > 0) {
      url += '?' + query.join('&');
    }

    return netUtil.fetch(url, {
      credentials: 'include',
    })
      .then(res => res.json())
      .catch(() => Promise.reject({
        reason: 'network',
        message: '通信エラー(network)',
      }))
      .then(onLoadPromise.bind(this, watchId, options, isRetry))
      .catch(err => {
        window.console.error('err', {err, isRetry, url, query});
        if (isRetry) {
          return Promise.reject({
            watchId,
            message: err.message || '動画情報の取得に失敗したか、未対応の形式です',
            type: 'watchapi'
          });
        }

        if (err.reason === 'forbidden') {
          return Promise.reject(err);
        } else if (err.reason === 'network') {
          return createSleep(5000).then(() => {
            window.console.warn('network error & retry');
            return loadPromise(watchId, options, true);
          });
        } else if (err.reason === 'flv' && !options.economy) {
          options.economy = true;
          window.console.log(
            '%cエコノミーにフォールバック(flv)',
            'background: cyan; color: red;');
          return createSleep(500).then(() => {
            return loadPromise(watchId, options, true);
          });
        } else {
          window.console.info('watch api fail', err);
          return Promise.reject({
            watchId,
            message: err.message || '動画情報の取得に失敗',
            info: err.info
          });
        }
      });
  };

  return {
    load: function (watchId, options) {
      const timeKey = `watchAPI:${watchId}`;
      window.console.time(timeKey);
      return loadPromise(watchId, options).then(
        (result) => {
          window.console.timeEnd(timeKey);
          return result;
        },
        (err) => {
          err.watchId = watchId;
          window.console.timeEnd(timeKey);
          return Promise.reject(err);
        }
      );
    }
  };
})();

//===END===

export {VideoInfoLoader};
