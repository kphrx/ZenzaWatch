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

  const parseWatchApiData = function (json) {
    const _data = json.data.response;
    const {
      // ads,
      // category,
      channel, // nullable
      client: {
        // nicosid,
        watchId,
        watchTrackId,
      },
      comment: {
        // isAttentionRequired,
        keys: {
          userKey,
        },
        layers,
        ng: {
          channel: channelNg,
          // ngScore,
          owner: ownerNg,
          // viewer,
        },
        nvComment,
        server: {
          url: commentServer,
        },
        threads,
      },
      community, // nullable
      // easyComment,
      external: {
        commons: {
          hasContentTree,
        },
        // ichiba,
      },
      genre: {
        // isDisabled,
        // isImmoral,
        // isNotSet,
        key: genreKey,
        // label,
      },
      // marquee,
      media: {
        delivery: dmcInfo, // nullable
        // deliveryLegacy,
        domand: domandInfo, // nullable
      },
      // okReason,
      owner, // nullable
      payment: {
        // preview,
        video: {
          // commentableUserType,
          isAdmission: isMemberFree,
          isPpv: isNeedPayment,
          isPremium: isPremiumFree,
          // watchableUserType,
        },
      },
      // pcWatchPage,
      player: {
        // comment,
        initialPlayback, // nullable
        // layerMode,
      },
      // ppv,
      // ranking,
      series,
      // smartphone,
      // system,
      tag: {
        // edit,
        // hasR18Tag,
        // isPublishedNicoscript,
        items: tags,
        // viewer,
      },
      video: {
        // 9d091f87, // version hash?
        // commentableUserTypeForPayment,
        count: {
          comment: commentCount,
          like: likeCount,
          mylist: mylistCount,
          view: viewCount,
        },
        description,
        duration,
        id: videoId,
        // isAuthenticationRequired,
        // isDeleted,
        // isEmbedPlayerAllowed,
        // isGiftAllowed,
        // isNoBanner,
        // isPrivate,
        // rating,
        registeredAt,
        thumbnail: {
          largeUrl: thumbnailUrl, // null
          // middleUrl,
          // ogp,
          url: thumbnail,
          player: largeThumbnail,
        },
        title,
        viewer: videoStatusForViewer, // nullable
        // watchableUserTypeForPayment,
      },
      // videoAds,
      // videoLive,
      viewer, // nullable
      // waku,
    } = _data;

    const hasLargeThumbnail = nicoUtil.hasLargeThumbnail(videoId);
    const csrfToken = null;
    const watchAuthKey = null;
    threads.forEach(thread => {
      thread.layer = layers.find(({threadIds}) => {
        return threadIds.some(({id, fork}) => id === thread.id && fork === thread.fork);
      });
    });
    const resumeInfo = (() => {
      const {
        type = '',
        positionSec = null,
      } = { ...initialPlayback };
      return {
        initialPlaybackType: type,
        initialPlaybackPosition: positionSec ?? 0,
      };
    })();
    const isLiked = videoStatusForViewer?.like.isLiked ?? false;
    const viewerInfo = (() => {
      const {
        id = 0,
        isPremium = false,
      } = { ...viewer };
      return { id, isPremium };
    })();
    const defaultThread = threads.find(t => t.isDefaultPostTarget);
    const msgInfo = {
      server: commentServer,
      threadId: defaultThread.id,
      duration,
      videoId,
      nvComment,
      userId: viewerInfo.id,
      isNeedKey: threads.findIndex(t => t.isThreadkeyRequired) >= 0, // (isChannel || isCommunity)
      optionalThreadId: '',
      defaultThread,
      optionalThreads: threads.filter(t => t.id !== defaultThread.id) || [],
      threads,
      userKey,
      hasOwnerThread: threads.find(t => t.isOwnerThread),
      when: null,
      frontendId: 6,
      frontendVersion: 0
    };

    const isDmc = dmcInfo?.movie.session != null;
    const isDomand = domandInfo != null;
    const isPlayable = isDmc || isDomand;

    cacheStorage.setItem('csrfToken', csrfToken, 30 * 60 * 1000);

    const playlist = {playlist: []};

    const tagList = tags.map(tag => {
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

    let channelInfo, channelId, uploaderInfo = null;
    if (channel) {
      const {
        id,
        // isDisplayAdBanner,
        // isOfficialAnime,
        name,
        thumbnail: {
          smallUrl,
          url,
        },
        // viewer: {
        //   follow: {
        //     isBookmarked,
        //     isFollowed,
        //     token,
        //     tokenTimestamp,
        //   },
        // },
      } = { ...channel };
      channelInfo = {
        iconUrl: smallUrl ?? url ?? undefined,
        id,
        linkId: id,
        name,
      };
      channelId = id;
    }
    if (owner) {
      const {
        // channel,
        iconUrl,
        id,
        // isMylistsPublic,
        // isVideosPublic,
        // live,
        nickname,
        // videoLiveNotice,
        // viewer: {
        //   isFollowing,
        // },
      } = { ...owner };
      uploaderInfo = {
        iconUrl,
        id,
        linkId: `user/${id}`,
        name: nickname,
      };
    }

    const watchApiData = {
      videoDetail: {
        v: watchId,
        id: videoId,
        title,
        // title_original: data.video.originalTitle,
        description,
        // description_original: data.video.originalDescription,
        postedAt: registeredAt,
        thumbnail,
        largeThumbnail,
        length: duration,

        commons_tree_exists: hasContentTree,

        // width: data.video.width, // dmcInfo?.movie.videos[0].metadata.resolution.width
        // height: data.video.height, // dmcInfo?.movie.videos[0].metadata.resolution.height

        isChannel: channel && channel.id,
        isMymemory: false,
        communityId: community?.id ?? null,
        isLiked,
        channelId,

        commentCount,
        likeCount,
        mylistCount,
        viewCount,

        tagList,
      },
      viewerInfo,
      channelInfo,
      uploaderInfo,
      clientTrackId: watchTrackId,
    };

    const ngFilters = Array.prototype.concat(channelNg, ownerNg);

    const result = {
      _format: 'html5watchApi',
      _data,
      watchApiData,
      domandInfo,
      dmcInfo,
      msgInfo,
      playlist,
      isPlayable,
      isDomand,
      isDmc,
      thumbnailUrl,
      csrfToken,
      watchAuthKey,
      series,
      genreKey,
      ngFilters,

      isMemberFree,
      isNeedPayment,
      isPremiumFree,
      linkedChannelVideo: null,
      resumeInfo,
    };

    emitter.emitAsync('csrfTokenUpdate', csrfToken);
    return result;
  };


  const loadLinkedChannelVideoInfo = (originalData) => {
    const linkedChannelVideo = originalData.linkedChannelVideo;
    const originalVideoId = originalData.watchApiData.videoDetail.id;
    const videoId = linkedChannelVideo.linkedVideoId;

    originalData.linkedChannelData = null;
    if (originalVideoId === videoId) {
      return Promise.reject();
    }

    const url = `https://www.nicovideo.jp/watch/${videoId}?responseType=json`;
    window.console.info('%cloadLinkedChannelVideoInfo', 'background: cyan', linkedChannelVideo);
    return new Promise(r => {
      setTimeout(r, 1000);
    }).then(() => netUtil.fetch(url, {credentials: 'include'}))
      .then(res => res.json())
      .then(json => {
        const data = parseWatchApiData(json);
        //window.console.info('linkedChannelData', data);
        originalData.dmcInfo = data.dmcInfo;
        originalData.domandInfo = data.domandInfo;
        originalData.isPlayable = data.isPlayable;
        originalData.isDmc = data.isDmc;
        originalData.isDomand = data.isDomand;
        return originalData;
      })
      .catch(() => {
        return Promise.reject({reason: 'network', message: '通信エラー(loadLinkedChannelVideoInfo)'});
      });
  };

  const onLoadPromise = async (watchId, options, isRetry, resp) => {
    const data = parseWatchApiData(resp);
    debug.watchApiData = data;
    if (!data) {
      throw {
        reason: 'network',
        message: '通信エラー。動画情報の取得に失敗しました。(watch api)'
      };
    }

    if (data.reject) {
      throw data;
    }

    if (data.isPlayable) {
      emitter.emitAsync('loadVideoInfo', data, 'WATCH_API', watchId);
      return data;
    }

    if (data.isNeedPayment && data.genreKey === 'anime' && Config.getValue('loadLinkedChannelVideo')) {
      const query = new URLSearchParams({ videoId: data.watchApiData.videoDetail.id, _frontendId: data.msgInfo.frontendId });
      const url = `https://public-api.ch.nicovideo.jp/v1/user/channelVideoDAnimeLinks?${query.toString()}`;
      const linkedChannelVideos = await netUtil.fetch(url, { credentials: 'include' })
        .then(r => r.json().data?.items ?? []).catch(() => []);
      data.linkedChannelVideo = linkedChannelVideos.find(ch => {
        return !!ch.isChannelMember;
      });
      if (data.linkedChannelVideo) {
        return await loadLinkedChannelVideoInfo(data);
      }
    }

    const error = (({isMemberFree, isNeedPayment, isPremiumFree}) => {
      if (!isNeedPayment && isPremiumFree) {
        return {
          reason: 'premium only',
          message: 'プレミアム会員限定',
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

    return netUtil.fetch(url, {credentials: 'include'})
      .then(res => res.json())
      .catch(() => Promise.reject({reason: 'network', message: '通信エラー(network)'}))
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
