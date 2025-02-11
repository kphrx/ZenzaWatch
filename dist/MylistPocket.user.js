// ==UserScript==
// @name        MylistPocket
// @namespace   https://github.com/segabito/
// @description 動画をあとで見る ＋ 簡易NG機能。 ZenzaWatchとの連携も可能。
// @match       *://www.nicovideo.jp/*
// @match       *://ext.nicovideo.jp/
// @match       *://ext.nicovideo.jp/#*
// @match       *://ch.nicovideo.jp/*
// @match       *://com.nicovideo.jp/*
// @match       *://commons.nicovideo.jp/*
// @match       *://dic.nicovideo.jp/*
// @match       *://ex.nicovideo.jp/*
// @match       *://info.nicovideo.jp/*
// @match       *://search.nicovideo.jp/*
// @match       *://uad.nicovideo.jp/*
// @match       *://site.nicovideo.jp/*
// @match       *://anime.nicovideo.jp/*
// @match       https://www.google.com/search?*
// @match       https://www.google.co.jp/search?*
// @match       https://*.bing.com/*
// @exclude     *://ads*.nicovideo.jp/*
// @exclude     *://www.upload.nicovideo.jp/*
// @exclude     *://www.nicovideo.jp/watch/*?edit=*
// @exclude     *://ch.nicovideo.jp/tool/*
// @exclude     *://flapi.nicovideo.jp/*
// @exclude     *://dic.nicovideo.jp/p/*
// @exclude     *://ext.nicovideo.jp/thumb/*
// @exclude     *://ext.nicovideo.jp/thumb_channel/*
// @version     0.5.15-fix-mylist-api.7
// @grant       none
// @author      segabito macmoto
// @license     public domain
// @require     https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.5/lodash.min.js
// @downloadURL    https://github.com/kphrx/ZenzaWatch/raw/playlist-deploy/dist/MylistPocket.user.js
// ==/UserScript==
/* eslint-disable */

const AntiPrototypeJs = function() {
	if (this.promise !== null || !window.Prototype || window.PureArray) {
		return this.promise || Promise.resolve(window.PureArray || window.Array);
	}
	if (document.getElementsByClassName.toString().indexOf('B,A') >= 0) {
		delete document.getElementsByClassName;
	}
	const waitForDom = new Promise(resolve => {
		if (['interactive', 'complete'].includes(document.readyState)) {
			return resolve();
		}
		document.addEventListener('DOMContentLoaded', resolve, {once: true});
	});
	const f = Object.assign(document.createElement('iframe'), {
		srcdoc: '<html><title>ここだけ時間が10年遅れてるスレ</title></html>',
		id: 'prototype',
		loading: 'eager'
	});
	Object.assign(f.style, {position: 'absolute', left: '-100vw', top: '-100vh'});
	return this.promise = waitForDom
		.then(() => new Promise(res => {
			f.onload = res;
			document.body.append(f);
		})).then(() => {
	window.PureArray = f.contentWindow.Array;
	delete window.Array.prototype.toJSON;
			delete window.String.prototype.toJSON;
			f.remove();
			return Promise.resolve(window.PureArray);
		}).catch(err => console.error(err));
}.bind({promise: null});
AntiPrototypeJs().then(() => {
  const PRODUCT = 'MylistPocket';

  const monkey = (PRODUCT) => {
    const console = window.console;
    const {workerUtil} = window.MylistPocketLib;
    //const $ = window.jQuery;
    console.log(`%c${PRODUCT}`,
      'font-family: "Apple LiGothic"; padding: 4px; background: red; color: white; font-size: 150%;'
    );
    const TOKEN = 'r:' + (Math.random());

    const CONSTANT = {
      BASE_Z_INDEX: 100000
    };
    const MylistPocket = {debug: {}};
    window.MylistPocket = MylistPocket;

    const protocol = location.protocol;
    const global = {
      debug: MylistPocket.debug,
      TOKEN,
      PRODUCT
    };

    const __css__ = (`
      a[href*='watch/'] > g-img {
        position: inherit;
      }

      .mylistPocketHoverMenu {
        display: none;
        opacity: 0.8;
        position: absolute;
        z-index: ${CONSTANT.BASE_Z_INDEX + 100000};
        font-size: 8pt;
        padding: 0;
        line-height: 26px;
        font-weight: bold;
        text-align: center;
        transition: box-shadow 0.2s ease, opacity 0.4s ease, padding 0.2s ease;
        user-select: none;
      }

      .mylistPocketHoverMenu.is-busy {
        opacity: 0 !important;
        pointer-events: none;
      }
        .mylistPocketHoverMenu.is-otherDomain .wwwOnly {
          display: none;
        }
        .mylistPocketHoverMenu.is-otherDomain:not(.is-zenzaReady) .wwwZenzaOnly {
          display: none;
        }
        .mylistPocketHoverMenu .zenzaMenu {
          display: none;
        }
        .mylistPocketHoverMenu.is-zenzaReady .zenzaMenu {
          display: inline-block;
        }


      .mylistPocketButton {
        /*font-family: Menlo;*/
        display: block;
        font-weight: bolder;
        cursor: pointer;
        width: 32px;
        height: 26px;
        background: #ccc;
        color: black;
        cursor: pointer;
        box-shadow: 1px 1px 1px #000;
        transition:
          0.1s box-shadow ease,
          0.1s transform ease;
        font-size: 16px;
        line-height: 24px;
        -webkit-user-select: none;
        -moz-use-select: none;
        user-select: none;
        outline: none;
      }

      .mylistPocketButton:hover {
        transform: scale(1.2);
        box-shadow: 4px 4px 5px #000;
      }

      .mylistPocketButton:active {
        transform: scale(1.0);
        box-shadow: none;
        transition: none;
      }

      .is-deflistUpdating .mylistPocketButton.deflist-add::after,
      .is-deflistSuccess  .mylistPocketButton.deflist-add::after,
      .is-deflistFail     .mylistPocketButton.deflist-add::after,
      .mylistPocketButton:hover::after, #mylistPocket-poupup [tooltip] {
        content: attr(tooltip);
        position: absolute;
        /*top:  0px;
        left: 50%;*/
        top:  50%;
        right: -8px;
        padding: 2px 4px;
        white-space: nowrap;
        font-size: 12px;
        color: #fff;
        background: #333;
        transform: translate3d(-50%, -120%, 0);
        transform: translate3d(100%, -50%, 0);
        pointer-events: none;
      }

      .is-deflistUpdating .mylistPocketButton.deflist-add {
        cursor: wait;
        opacity: 0.9;
        transform: scale(1.0);
        box-shadow: none;
        transition: none;
        background: #888;
        border-style: inset;
      }
      .is-deflistSuccess .mylistPocketButton.deflist-add,
      .is-deflistFail    .mylistPocketButton.deflist-add {
        transform: scale(1.0);
        box-shadow: none;
        transition: none;
      }
      .is-deflistSuccess  .mylistPocketButton.deflist-add::after {
        content: attr(data-result);
        background: #393;
      }
      .is-deflistFail     .mylistPocketButton.deflist-add::after {
        content: attr(data-result);
        background: #933;
      }
      .is-deflistUpdating .mylistPocketButton.deflist-add::after {
        content: '更新中';
        background: #333;
      }

      .mylistPocketButton + .mylistPocketButton {
        margin-top: 4px;
      }

      .mylistPocketHoverMenu:hover {
        font-weibht: bolder;
        opacity: 1;
      }

      .mylistPocketHoverMenu:active {
      }

      .mylistPocketHoverMenu.is-show {
        display: block;
      }

      #mylistPocket-popup {
        display: none;
        perspective: 800px;
      }
      #mylistPocket-popup.is-firefox {
        /*perspective: none !important;*/
        position: fixed;
        transform: translate3d(-50%, -50%, 0);
        opacity: 0;
        transition: 0.3s opacity ease;
        top: -9999px; left: -9999px;
      }

      #mylistPocket-popup.show {
        display: block;
      }
      #mylistPocket-popup.is-firefox.show {
        top: 50%;
        left: 50%;
        opacity: 1;
      }


      #mylistPocket-popup .owner-icon {
        width: 64px;
        height: 64px;
        transform-origin: center;
        transform-origin: center;
        transition:
          0.2s transform ease,
          0.2s box-shadow ease
        ;
      }
      #mylistPocket-popup .owner-icon:hover {
      }

      #mylistPocket-popup .description a {
        color: #ffff00 !important;
        text-decoration: none !important;
        font-weight: normal !important;
        display: inline-block;
      }
      #mylistPocket-popup .description a.watch {
        position: relative;
        display: block;
        backface-visibility: hidden;
      }

      #mylistPocket-popup .description a[data-title]:hover::after {
        content: attr(data-title);
        position: absolute;
        top: -16px;
        left: 0;
        word-break: break-all;
        line-height: 12px;
        padding: 4px;
        font-size: 12px;
        color: #333;
        background: #ffc;
        opacity: 0.8;
        user-select: none;
        pointer-events: none;
      }

      #mylistPocket-popup .description a:visited {
        color: #ffff99 !important;
      }
      #mylistPocket-popup .description button {
        /*font-family: Menlo;*/
        font-size: 16px;
        font-weight: bolder;
        margin: 4px 8px;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 0;
        background: #333;
        color: #ccc;
        border: solid 2px #ccc;
        outline: none;
      }
      #mylistPocket-popup .description button:hover {
        transform: translate(-2px,-2px);
        box-shadow: 2px 2px 2px #000;
        background: #666;
        transition:
          0.2s transform ease,
          0.2s box-shadow ease
          ;
      }
      #mylistPocket-popup .description button:active {
        transform: none;
        box-shadow: none;
        transition: none;
      }
      #mylistPocket-popup .description button:active::hover {
        opacity: 0;
      }

      #mylistPocket-popup .watch {
        display: block;
        position: relative;
        line-height: 60px;
        box-sizing: border-box;
        padding: 4px 16px;;
        min-height: 60px;
        width: 280px;
        margin: 8px 10px;
        background: #444;
        border-radius: 4px;
      }

      #mylistPocket-popup .watch:hover {
        background: #446;
      }

      #mylistPocket-popup .videoThumbnail {
        position: absolute;
        right: 16px;
        height: 60px;
        transform-origin: center;
        transition:
          0.2s transform ease,
          0.2s box-shadow ease
        ;
      }
      #mylistPocket-popup .videoThumbnail:hover {
        transform: scale(2);
        box-shadow: 0 0 8px #888;
        transition:
          0.2s transform ease 0.5s,
          0.2s box-shadow ease 0.5s
        ;
      }


    .zenzaPlayerContainer.is-error   #mylistPocket-popup,
    .zenzaPlayerContainer.is-loading #mylistPocket-popup,
    .zenzaPlayerContainer.error   #mylistPocket-popup,
    .zenzaPlayerContainer.loading #mylistPocket-popup {
      opacity: 0;
      pointer-events: none;
    }

    .mylistPocketHoverMenu.is-guest .is-need-login {
      display: none !important;
    }

      .xDomainLoaderFrame {
        position: fixed;
        left: -100%;
        top: -100%;
        width: 64px;
        height: 64px;
        opacity: 0;
        border: 0;
      }

      body.BaseLayout {
        margin-top: 0 !important;
      }
      ${
      location.host === 'www.niovideo.jp' ? `
      #siteHeader {
        position: sticky;
        left: 0 !important;
        will-change: transform;
      }

      body.nofix #siteHeader {
        position: static;
      }

      .RankingMainContainer-header {
        position: sticky;
        top: 36px;
        z-index: 1000;
        background:
          linear-gradient(to bottom,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 1.0),
            rgba(255, 255, 255, 0.8),
            rgba(232, 232, 255, 0)
          );
      }
      .nofix .RankingMainContainer-header {
        top: 0;
      }

      .RankingBaseItem {
        border-radius: 0 !important;
        box-shadow: none !important;
        border: 1px solid silver;
        pointer-events: none;
        user-select: none;
        display: grid;
      }
        .RankingBaseItem .Card-link {
          display: grid;
          grid-template-rows: 108px auto;
        }
          .RankingBaseItem .Card-media {
            position: static;
            pointer-events: auto;
          }
            .VideoThumbnail {
              border-radius: 0 !important;
            }
          .RankingBaseItem .Card-title {
            pointer-events: auto;
            user-select: auto;
            height: auto;
            max-height: 49px;
            -webkit-line-clamp: unset;

          }
          .RankingBaseItem .Card-secondary {
            width: 100%;
            user-select: none;
            pointer-events: none;
            align-self: end;
            overflow: hidden;

          }

      [data-nicoad-grade=gold] .Thumbnail.VideoThumbnail {
        background: #f7e01c;
      }
      [data-nicoad-grade=silver] .Thumbnail.VideoThumbnail {
        background: #dfeaec;
      }

      .MatrixRanking-body.GlobalHeader#siteHeader #siteHeaderInner {
        width: 1232px;
      }

      .MatrixRanking-body .RankingRowRank {
        line-height: 48px;
        height: 48px;
        pointer-events: none;
        user-select: none;
      }
      .MatrixRanking-body .RankingMatrixVideosRow {
        width: ${1232 + 64}px;
        margin-left: ${-64}px;
      }
      .MatrixRanking-body .RankingRowRank {
        position: sticky;
        left: -8px;
        z-index: 100;
        transform: none;
        padding-right: 16px;
        width: 64px;
        overflow: visible;
        text-align: right;
        mix-blend-mode: difference;
        text-shadow:
           1px  1px 0 #fff,
           1px -1px 0 #fff,
          -1px  1px 0 #fff,
          -1px -1px 0 #fff;

              }
      ` : ''}
    `).trim();

    const nicoadHideCss = `
      .nicoadVideoItem {
        display: none;
      }
      .MatrixRankingBannerAd,
      .RankingMatrixNicoadsRow, .RankingMainNicoad {
        display: none;
      }
    `.trim();

    const responsiveCss = `

      @media screen and (max-width: 1350px) {
        .RankingGenreListContainer {
          border-right: 0;
          border-left: 56px solid #fafafa;
        }
        .RankingGenreListContainer-categoryHelp {
          position: static;
        }
        .GlobalHeader#siteHeader #siteHeaderInner {
          width: 1024px;
        }
        .RankingHeaderContainer-headerInner {
          margin-left: 64px;
          width: 1214px;
        }
        .LaneHeader {
          flex: 1 1 160px;
          width: 160px;
        }
        .LaneHeader+.LaneHeader {
          /*margin-left: 13px;*/
        }
        .LaneHeader>p {
          white-space: normal;
          height: 32px;
          line-height: 16px;
        }
        .CustomButton {
          width: 136px;
        }
        .MatrixRanking-body .BaseLayout-block {
          width: ${1280}px;
        }
        .RankingMainContainer-decorateChunk+.RankingMainContainer-decorateChunk,
         .RankingMainContainer-decorateChunk>*+* {
           margin-top: 0;
        }
        .RankingMainContainer {
          width: ${1024}px;
        }
        .MatrixRanking-body .RankingMatrixVideosRow {
          width: ${1024 + 64}px;
          margin-left: ${-64}px;
        }
          .RankingMatrixNicoadsRow>*+*,
          .RankingMatrixVideosRow>:nth-child(n+3) {
              margin-left: 13px;
          }
          .RankingBaseItem {
            width: 160px;
            height: 196px;
          }
            .RankingBaseItem .Card-link {
            grid-template-rows: 90px auto;
            }
            .VideoItem.RankingBaseItem .VideoThumbnail {
              border-radius: 3px 3px 0 0;
            }

            [data-nicoad-grade] .Thumbnail.VideoThumbnail .Thumbnail-image {
                margin: 3px;
                background-size: calc(100% + 6px);
            }
            [data-nicoad-grade] .Thumbnail.VideoThumbnail:after {
                width: 40px;
                height: 40px;
                background-size: 80px 80px;
            }
            .Thumbnail.VideoThumbnail .VideoLength {
              bottom: 3px;
              right: 3px;
            }
            .VideoThumbnailComment {
              transform: scale(0.8333);
            }
            .RankingBaseItem-meta {
              position: static;
              padding: 0 4px 8px;
            }
            .VideoItem.RankingBaseItem .VideoItem-metaCount>.VideoMetaCount {
              white-space: nowrap;
            }
        .RankingMainContainer .ToTopButton {
          transform: translateX(calc(100vw / 2 - 100% - 36px));
          user-select: none;
        }
      }
    `;

    const __tpl__ = (`
      <div class="mylistPocketHoverMenu scalingUI zen-family">
        <button class="mylistPocketButton command deflist-add wwwZenzaOnly is-need-login" data-command="deflist"
          tooltip="とりあえずマイリスト">&#x271A;</button>
        <button class="mylistPocketButton command info" data-command="info"
          tooltip="動画情報を表示">？</button>
        <button class="mylistPocketButton command playlist-queue zenzaMenu" data-command="playlist-queue"
          tooltip="ZenzaWatchのプレイリストに追加">▶</button>
      </div>
      </div>

      <div id="mylistPocket-popup" class="zen-family">
        <span slot="video-title">【実況】どんぐりころころの大冒険 Part1(最終回)</span>
        <a href="/watch/sm9" slot="watch-link"></a>
        <img slot="video-thumbnail" data-type="image">
        <a slot="owner-page-link" href="https://www.nicovideo.jp/user/1234" class="owner-page-link target-change" data-type="link" rel="noopener"><img slot="owner-icon" class="owner-icon" src="https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank_s.jpg" data-type="image"></img></a>

        <span slot="upload-date"     data-type="date">1970/01/01 00:00</span>
        <span slot="view-counter"    data-type="int">12,345</span>
        <span slot="mylist-counter"  data-type="int">6,789</span>
        <span slot="comment-counter" data-type="int">2,525</span>

        <span slot="duration" class="duration">1:23</span>

        <span slot="owner-id">1234</span>
        <span slot="locale-owner-name">ほげほげ</span>

        <div slot="error-description"></div>
        <div class="description" slot="description" data-type="html"></div>
        <span slot="last-res-body"></span>

      </div>

      <template id="mylistPocket-popup-template">
        <style>

          :host(#mylistPocket-popup) {
            position: fixed;
            z-index: 10000000;
            transform: translate3d(-50%, -50%, 0);
            opacity: 0;
            transition: 0.3s opacity ease;
            top: -9999px; left: -9999px;
          }

          :host(#mylistPocket-popup.show) {
            top: 50%;
            left: 50%;
            opacity: 1;
            pointer-events: auto;
          }

          .root.is-otherDomain .wwwOnly {
            display: none;
          }
          .root.is-otherDomain:not(.is-zenzaReady) .wwwZenzaOnly {
            display: none;
          }

          * {
            box-sizing: border-box;
            font-kerning: none;
          }

          a {
            color: #ffff00;
            font-weight: bold;
            display: inline-block;
          }

          a:visited {
            color: #ffff99;
          }

          button {
            font-size: 14px;
            padding: 8px 8px;
            cursor: pointer;
            border-radius: 0;
            margin: 0;
            background: #333;
            color: #ccc;
            border: solid 2px #ccc;
            outline: none;
            line-height: 20px;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
          }
          button:hover {
            transform: translate(-4px,-4px);
            box-shadow: 4px 4px 4px #000;
            background: #666;
            transition:
              0.2s transform ease,
              0.2s box-shadow ease
              ;
          }

          button.is-updating {
            cursor: wait;
          }
          button.is-active,
          button:active {
            transform: none;
            box-shadow: none;
            transition: none;
          }
          button.is-active::after,
          button:active::after {
            opacity: 0;
          }


          [tooltip] {
            position: relative;
          }

          .is-deflistUpdating .deflist-add::after,
          .is-deflistSuccess  .deflist-add::after,
          .is-deflistFail     .deflist-add::after,
          [tooltip]:hover::after {
            content: attr(tooltip);
            position: absolute;
            top:  0px;
            left: 50%;
            padding: 2px 4px;
            white-space: nowrap;
            font-size: 14px;
            color: #fff;
            background: #333;
            transform: translate3d(-50%, -120%, 0);
            pointer-events: none;

          }


          .root {
            text-align: left;
            outline-offset: 8px;
            border: 12px solid rgba(32, 32, 32, 0);
            border-radius: 20px;
            padding: 8px 0;
            background: rgba(0, 0, 0, 0.7);
            color: #ccc;
            box-shadow: 0 0 16px #000;
            transition:
              0.6s -webkit-clip-path ease,
              0.6s clip-path ease,
              0.5s transform ease;
              /*0.4s border-radius ease-out 0.4s,
              0.4s height ease-out 0.4s*/
            ;
          }

          .root * {
          }

          .root.show {
            opacity: 1;
            pointer-events: auto !important;
          }

          .root.is-loading,
          .root.is-loading.is-ok,
          .root.is-loading.is-fail {
            text-align: center;
            position: relative;
            width: 190px;
            height: 190px;
            padding: 32px;
            opacity: 0.8;
            cursor: wait;
            border-radius: 100%;
            clip-path: circle(100px at center) !important;
            transition: none;
            outline: none;
            transform: none !important;
          }
          .root.is-firefox {
          }
          .root.is-loading > * {
            pointer-events: none;
          }

          .root.is-setting {
            transform: rotateX(180deg);
          }

          .root.is-setting > *:not(.setting-panel) {
            pointer-events: none;
            z-index: 1;
          }

          .root:not(.is-setting) > .setting-panel {
            pointer-events: none;
          }

          .root.is-setting > .setting-panel {
            display: block;
            opacity: 1;
            pointer-events: auto;
          }

          .root.is-loading         .loading-inner,
          .root.is-loading.is-ok   .loading-inner,
          .root.is-loading.is-fail .loading-inner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate3d(-50%, -50%, 0);
          }

          .loading-inner .spinner {
            font-size: 64px;
            display: inline-block;
            animation-name: spin;
            animation-iteration-count: infinite;
            animation-duration: 3s;
            animation-timing-function: linear;
          }

          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(1800deg); }
          }



          .root.is-ok {
            width: 800px;
            /*clip-path: circle(800px at center);*/
          }

          .root.is-ok.noclip {
            clip-path: none;
          }

          .root.is-fail {
            font-size: 120%;
            white-space: nowrap;
            text-align: center;
            padding: 16px;
          }

          .root.is-loading>*:not(.loading-now),
          .root.is-loading.is-ok>*:not(.loading-now),
          .root.is-loading.is-fail>*:not(.loading-now),
          .root.is-fail:not(.is-loading)>*:not(.error-info),
          .root.is-ok:not(.is-loading)>*:not(.video-detail):not(.setting-panel) {
            display: none !important;
          }

          .root.is-loading>.loading-now,
          .root.is-fail>.error-info,
          .root.is-ok>.video-detail {
            display: block;
          }

          .header {
            padding: 8px 8px 8px;
            font-size: 12px;
          }
            .upload-date {
              margin-right: 8px;
            }
            .counter span + span {
              margin-left: 8px;
            }
            .video-title {
              font-weight: bolder;
              font-size: 22px;
              margin-bottom: 4px;
            }

            .close-button {
              position: absolute;
              right: 0;
              top: 0;
              transition: 0.2s background ease, 0.2s border-color ease;
              cursor: pointer;
              width: 48px;
              height: 48px;
              font-size: 28px;
              line-height: 36px;
              text-align: center;
              user-select: none;
              border: 6px solid rgba(80, 80, 80, 0.5);
              border-color: transparent;
              border-radius: 0 16px 0 0;
            }
            .close-button:hover {
              background: #333;
              /*border-color: rgba(0, 0, 0, 0.9);*/
              /*transform: translate(-50%, -50%) scale(2.5);*/
            }
            .close-button:active {
              /*transform: translate(-50%, -50%) scale(2) rotate(360deg);*/
              box-shadow: none;
              transition: none;
            }

            .is-setting .close-button {
              display: none;
            }




          .main {
            display: flex;
            background: rgba(0, 0, 0, 0.2);
            box-shadow: 0 0 4px rgba(0, 0, 0, 0.5) inset;
          }

          .main-left {
            width: 360px;
            padding: 8px;
            z-index: 100;
          }
            .video-thumbnail-container {
              position: relative;
              width: 360px;
              height: 270px;
              background: #000;
              /*box-shadow: 2px 2px 4px #000;*/
            }
            .video-thumbnail-container ::slotted(img) {
              width: 360px !important;
              height: 270px !important;
              object-fit: contain;
            }

            .video-thumbnail-container .duration {
              position: absolute;
              display: inline-block;
              right: 0;
              bottom: 0;
              font-size: 14px;
              background: #000;
              color: #fff;
              padding: 2px 4px;
            }
            .video-thumbnail-container:hover .duration {
              display: none;
            }


          .main-right {
            position: relative;
            padding: 0;
            flex-grow: 1;
            font-size: 14px;
          }

            ::slotted(.owner-page-link) {
              display: inline-block;
              vertical-align: middle;
            }

            .owner-page-link img {
              border: 1px solid #333;
              border-radius: 3px;
            }

            .video-info {
              /*background: rgba(0, 0, 0, 0.2);*/
              max-height: 282px;
              overflow-x: hidden;
              overflow-y: scroll;
              overscroll-behavior: contain;
            }

            *::-webkit-scrollbar,
            .video-info::-webkit-scrollbar {
              background: rgba(34, 34, 34, 0.5);
            }

            *::-webkit-scrollbar-thumb,
            .video-info::-webkit-scrollbar-thumb {
              border-radius: 0;
              background: #666;
            }

            *::-webkit-scrollbar-button,
            .video-info::-webkit-scrollbar-button {
              background: #666;
              display: none;
            }

            *::scrollbar,
            .video-info::scrollbar {
              background: #222;
            }

            *::scrollbar-thumb,
            .video-info::scrollbar-thumb {
              border-radius: 0;
              background: #666;
            }

            *::scrollbar-button,
            .video-info::scrollbar-button {
              background: #666;
              display: none;
            }

            .scrollable {
              overscroll-behavior: contain;
            }

            .owner-info {
              margin: 16px;
              display: table;
            }

              .owner-info * {
                vertical-align: middle;
                word-break: break-all;
              }

              .owner-info>* {
                display: table-cell !important;
              }

              .owner-name {
                display: inline-block;
                padding: 8px;
                font-size: 18px;
              }
              .owner-info.is-favorited {
                font-weight: bolder;
                color: orange;
              }

              .owner-info.is-ng {
                color: #888;
                text-decoration: line-through;
              }

              .is-channel .owner-name::before {
                content: 'CH';
                margin: 0 4px;
                background: #999;
                color: #333;
                padding: 2px 4px;
                border: 1px solid;
              }

              .locale-owner-name::after {
                content: ' さん';
              }

              .owner-info .add-ng-button,
              .owner-info .add-fav-button {
                visibility: hidden;
                pointer-events: none;
              }
              .is-ng-enable .owner-info:hover .add-ng-button,
              .is-ng-enable .owner-info:hover .add-fav-button {
                visibility: visible;
                pointer-events: auto;
              }

            .description {
              word-break: break-all;
              line-height: 1.5;
              padding: 0 16px 8px;
            }

            .description:first-letter {
              font-size: 24px;
            }

            .last-res-body {
              margin: 16px 16px 0;
              border: 1px solid #ccc;
              padding: 4px;
              border-radius: 4px;
              word-break: break-all;
              font-size: 12px;
              min-height: 24px;
            }


          .footer {
            padding: 8px;
            backface-visibility: hidden;
          }

            .pocket-button {
              cusror: pointer;
            }

            .pocket-button:active {
            }


            .video-tags {
              display: block;
            }

              .tag-container {
                display: inline-block;
                position: relative;
                padding: 4px 8px;
                border: 1px solid #888;
                border-radius: 4px;
                margin: 0 20px 4px 0;
              }
              .tag-container .tag {
                display: inline-block;
                font-size: 14px;
                color: #ccc;
                text-decoration: none;
                cursor: pointer;
              }
              .tag-container .tag.channel-search {
                margin-left: 8px;
                color: #ccc !important;
                padding: 0 8px;
              }
              .tag-container:hover .tag {
                color: #fff !important;
              }
              .tag-container.is-favorited .tag {
                font-weight: bolder;
                color: orange !important;
              }
              .tag-container.is-ng .tag {
                text-decoration: line-through;
                color: #888 !important;
              }
              .zenzaPlayerContainer .tagItemMenu {
                margin: 0 8px;
              }


              .tag-container       .add-ng-button,
              .tag-container       .add-fav-button {
                position: absolute !important;
                visibility: hidden;
                pointer-events: none;
              }
              .is-ng-enable .tag-container:hover .add-ng-button,
              .is-ng-enable .tag-container:hover .add-fav-button {
                visibility: visible;
                pointer-events: auto;
                width: 24px;
                height: 24px;
                line-height: 24px;
                font-size: 24px;
                vertical-align: bottom;
                display: inline-block;
              }
              .is-ng-enable .tag-container:hover .add-ng-button {
                right: -16px;
              }
              .is-ng-enable .tag-container:hover .add-fav-button {
                left: -16px;
              }

            .footer-menu {
              position: absolute;
              right: 0px;
              bottom: 0px;
              transform: translate3d(0, 120%, 0);
              opacity: 1;
              transition:
                0.4s opacity ease 0.4s,
                0.4s transform ease 0.4s;
            }

            .is-setting .video-detail .footer-menu {
              transform: translate3d(0, 0, 0);
              opacity: 0;
            }

              .footer-menu button {
                min-width: 70px;
              }

              .regular-menu {
                display: inline-block;
                background: rgba(0, 0, 0, 0.7);
                position: relative;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 0 16px #000;
              }

              .is-deflistUpdating .deflist-add {
                cursor: wait;
                opacity: 0.9;
                transform: scale(1.0);
                box-shadow: none;
                transition: none;
              }
              .is-deflistSuccess .deflist-add,
              .is-deflistFail    .deflist-add {
                transform: scale(1.0);
                box-shadow: none;
                transition: none;
              }
              .is-deflistSuccess  .deflist-add::after {
                content: attr(data-result);
                background: #393;
              }
              .is-deflistFail     .deflist-add::after {
                content: attr(data-result);
                background: #933;
              }
              .is-deflistUpdating .deflist-add::after {
                content: '更新中';
                background: #333;
              }

              .zenza-menu {
                display: none;
              }

              .is-zenzaReady .zenza-menu {
                display: inline-block;
                background: rgba(0, 0, 0, 0.7);
                margin-left: 32px;
                position: relative;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 0 16px #000;
              }

              .is-zenzaReady .zenza-menu::after {
                content: 'ZenzaWatch';
                position: absolute;
                left: 50%;
                bottom: 10px;
                padding: 2px 8px;
                transform: translate(-50%, 100%);
                pointer-events: none;
                font-weith: bolder;
                background: rgba(0, 0, 0, 0.7);
                pointer-events: none;
                border-radius: 4px;
                white-space: nowrap;
              }

              .setting-menu {
                display: inline-block;
                background: rgba(0, 0, 0, 0.7);
                margin-left: 32px;
                position: relative;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 0 16px #000;
              }

          .toggle-setting-button {
            font-size: 32px;
            border-radius: 100%;
            border: 12px solid #333;
            cursor: pointer;
            background: rgba(32, 32, 32, 1);
            transition:
              0.2s transform ease
              ;
          }

          .toggle-setting-button:hover {
            transform: scale(1.2);
            box-shadow: none;
            background: rgba(32, 32, 32, 1);
            background: transparent;
          }

          .toggle-setting-button:active {
            transform: scale(1.0);
          }

          .mylist-comment-link {
            cursor: pointer;
          }

          .setting-panel {
            opacity: 0;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 8px 12px;
            z-index: 10000;
            background: rgba(50, 50, 64, 0.9);
            border-radius: 16px;
            color: #ccc;
            /*-webkit-user-select: none;
            user-select: none;*/
            transform: rotateX(180deg);
            transition: 0.25s opacity ease 0.25s;
          }
          .is-setting .setting-panel {
            transition: 0.25s opacity ease;
          }
            .setting-panel-main {
              width: 100%;
              height: 100%;
              overflow-y: scroll;
              overflow-x: hidden;
            }

            .root:not(.is-setting) .setting-panel .footer-menu {
              transform: translate3d(0, 0, 0);
              opacity: 0;
            }

            .root.is-setting       .setting-panel .footer-menu {
              right:  -12px;
              bottom: -12px;
              transform: translate3d(0, 120%, 0);
              opacity: 1;
              transition:
                opacity 0.4s ease 0.4s,
                transform 0.4s ease 0.4s;
            }


            .close-setting-menu {
              display: inline-block;
              background: rgba(0, 0, 0, 0.7);
              margin-left: 32px;
              position: relative;
              border-radius: 8px;
              padding: 12px 16px;
              box-shadow: 0 0 16px #000;
            }

            .setting-label {
              display: inline-block;
              line-height: 24px;
              padding: 8px;
            }

            .setting-label:hover {
              text-shadow: 0 0 4px #996;
            }

            .setting-label * {
              cursor: pointer;
            }

            .setting-label input[type=checkbox] {
              transform: scale(2);
              margin: 8px;
              vertical-align: middle;
            }

            .setting-label input + span {
              font-size: 16px;
            }

            .setting-label input:checked + span {
            }


            .setting-fav,
            .setting-ng-textarea,
            .setting-fav-textarea {
              display: none;
            }

            .is-ng-enable .setting-fav {
              display: block;
            }
            .is-ng-enable .setting-ng-textarea,
            .is-ng-enable .setting-fav-textarea {
              display: flex;
            }

              .setting-ng-text-column,
              .setting-fav-text-column {
                flex: 1;
                position: relative;
                padding: 8px;
              }

                .setting-ng-text-column textarea,
                .setting-fav-text-column textarea {
                  width: 100%;
                  height: 150px;
                  background: transparent;
                  color: #ccc;
                }

            .setting-ng-label {
              display: none;
            }

            .is-ng-enable .setting-ng-label {
              display: inline-block;
            }


          .add-ng-button,
          .add-fav-button {
            display: none;
          }

          .is-ng-enable .add-ng-button,
          .is-ng-enable .add-fav-button {
            display: inline-block;
            position: relative;
            width: 32px;
            height: 32px;
            line-height: 32px;
            font-size: 28px;
            padding: 0;
            margin: 0;
            /*border-radius: 100%;*/
            border: none;
            text-align: center;
            color: red;
            font-weight: bolder;
            cursor: pointer;
            background: transparent;
            box-shadow: none;
            transition:
              0.2s transform ease,
              0.2s text-shadow ease;
          }
          .is-ng-enable .add-fav-button {
            color: orange;
          }
          .is-ng-enable .add-ng-button:hover,
          .is-ng-enable .add-fav-button:hover {
            transform: scale(1.2);
            text-shadow: 2px 2px 4px black;
          }
          .is-ng-enable .add-ng-button:active,
          .is-ng-enable .add-fav-button:active {
            transform: scale(1.0);
            text-shadow: 0   0   2px black;
          }
          .is-ng-enable .add-ng-button:hover::after,
          .is-ng-enable .add-fav-button:hover::after {
            content: 'NG登録';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translate(-50%, -80%);
            font-size: 12px;
            line-height: 12px;
            white-space: nowrap;
            background: rgba(192, 192, 192, 0.8);
            color: #000;
            opacity: 0.9;
            padding: 2px 4px;
            text-shadow: none;
            font-weight: normal;
            pointer-evnets: none !important;
          }
          .is-ng-enable .is-ng .add-ng-button:hover::after,
          .is-ng-enable .is-ng .add-fav-button:hover::after {
            content: 'NG解除';
          }
          .is-ng-enable .add-fav-button:hover::after {
            content: '強調登録';
          }
          .is-ng-enable .is-favorited .add-fav-button:hover::after {
            content: '強調解除';
          }
          .is-ng-enable .add-ng-button:active:hover::after,
          .is-ng-enable .add-fav-button:active:hover::after {
            display: none;
          }

       </style>
        <div class="popup root">
          <div class="loading-now">
            <div class="loading-inner">
              <span class="spinner">&#8987;</span>
            </div>
          </div>
          <div class="error-info">
            <slot name="error-description"></slot>
          </div>
          <div class="video-detail">
            <div class="header">
              <div class="video-title"><slot name="video-title"></slot></div>

              <span class="upload-date">投稿: <slot name="upload-date"/></span>
              <span class="counter">
                <span class="view-counter">再生: <slot name="view-counter"/></span>
                <span class="comment-counter">コメント: <slot name="comment-counter"/></span>
                <span class="mylist-counter command2" data-command="mylist-comment-open">マイリスト:
                  <span class="mylist-comment-link command" data-command="mylist-comment-open">&#x274F;</span>
                  <slot name="mylist-counter"/>
                </span>
              </span>
              <div class="close-button command" data-command="close" tooltip="閉じる">
                &#x2716;
              </div>
            </div>

            <div class="main">

              <div class=" main-left">
                <div class="video-thumbnail-container">
                  <slot name="video-thumbnail"></slot>
                  <span class="duration"><slot name="duration"></slot></slot>
                </div>
              </div>

              <div class="video-info main-right scrollable">

                <div class="owner-info">
                  <slot name="owner-page-link"></slot>
                  <span class="owner-name"><slot name="locale-owner-name"></slot>
                  <button class="add-fav-button command" data-command="toggle-fav-owner">★</button>
                  <button class="add-ng-button command" data-command="toggle-ng-owner">&#x2716;</button>
                  </span>
                </div>

                <div class="description">
                  <slot name="description"></slot>
                </div>

                <div class="last-res-body">
                  <slot name="last-res-body"></slot>
                </div>


              </div>

            </div>

            <div class="footer">
              <div class="video-tags">
                <slot name="tag"></slot>
              </div>
            </div>
            <div class="footer-menu scalingUI">
              <div class="regular-menu">
                <button
                  class="mylistPocketButton deflist-add pocket-button command command-watch-id wwwZenzaOnly"
                  data-command="deflist-add"
                  tooltip="とりあえずマイリスト"
                >とり</button>
                <button
                  class="pocket-button command command-watch-id"
                  data-command="mylist-window"
                  tooltip="マイリスト"
                >マイ</button>
                <button
                  class="pocket-button command command-watch-id"
                  data-command="open-mylist-open"
                  tooltip="公開マイリスト"
                >公開</button>
                 <button
                  class="pocket-button command command-video-id"
                  data-command="twitter-hash-open"
                  tooltip="Twitterの反応"
                >#Twitter</button>
              </div>


              <div class="zenza-menu">
                <button
                  class="pocket-button command command-watch-id"
                  data-command="zenza-open-now"
                  tooltip="ZenzaWatchで開く"
                >Zen</button>
                <button
                  class="pocket-button command command-watch-id"
                  data-command="playlist-inert"
                  tooltip="プレイリスト(次に再生)"
                >playlist</button>
                <button
                  class="pocket-button command command-watch-id"
                  data-command="playlist-queue"
                  tooltip="プレイリスト(末尾に追加)"
                >▶</button>
              </div>

              <div class="setting-menu">
                <button
                  class="pocket-button command"
                  data-command="toggle-setting"
                >設 定</button>
              </div>

            </div>
          </div>
          <div class="setting-panel">

            <div class="setting-panel-main scrollable">
              <h2>MylistPocket 設定</h2>
              <label class="setting-label">
                <input
                  type="checkbox"
                  class="setting-form"
                  data-config-name="openNewWindow"
                >
                <span>タグやリンクを新しいタブで開く (次回から反映)</span>
              </label>

              <label class="setting-label">
                <input
                  type="checkbox"
                  class="setting-form"
                  data-config-name="enableAutoComment"
                  data-config-namespace="mylist"
                >
                <span>マイリストコメントに投稿者名を入れる</span>
              </label>

              <label class="setting-label">
                <input
                  type="checkbox"
                  class="setting-form"
                  data-config-name="responsive.matrix"
                  data-config-namespace=""
                >
                <span>ランキングTOPのサムネイルを画面幅に合わせて小さくする</span>
              </label>

              <h2>NG設定(リロード後に反映)</h2>
              <label class="setting-label">
                <input
                  type="checkbox"
                  class="setting-form"
                  data-config-name="enable"
                  data-config-namespace="ng"
                >
                <span>簡易NG＆強調機能を使う</span>
              </label>

              <label class="setting-label">
                <input
                  type="checkbox"
                  class="setting-form"
                  data-config-name="hide"
                  data-config-namespace="nicoad"
                >
                <span>検索結果やランキングのニコニ広告を消す</span>
              </label>

              <label class="setting-label wwwOnly wwwZenzaOnly setting-ng-label">
                <input
                  type="checkbox"
                  class="setting-form"
                  data-config-name="syncZenza"
                  data-config-namespace="ng"
                >
                <span>NGタグ・投稿者をZenzaWatchにも反映する</span>
              </label>

              <div class="setting-ng-textarea setting-ng">
                <div class="setting-ng-text-column">
                  投稿者ID
                  <textarea
                    class="setting-form"
                    data-config-name="owner"
                    data-config-namespace="ng"
                  ></textarea>
                </div>
                <div class="setting-ng-text-column">
                  タグ
                  <textarea
                    class="setting-form"
                    data-config-name="tag"
                    data-config-namespace="ng"
                  ></textarea>
                </div>
                <div class="setting-ng-text-column">
                  タイトル・説明文
                  <textarea
                    class="setting-form"
                    data-config-name="word"
                    data-config-namespace="ng"
                  ></textarea>
                </div>
               </div>
              <h2 class="setting-fav">強調表示設定</h2>
              <div class="setting-fav-textarea setting-fav">
                <div class="setting-fav-text-column">
                  投稿者ID
                  <textarea
                    class="setting-form"
                    data-config-name="owner"
                    data-config-namespace="fav"
                  ></textarea>
                </div>
                <div class="setting-fav-text-column">
                  タグ
                  <textarea
                    class="setting-form"
                    data-config-name="tag"
                    data-config-namespace="fav"
                  ></textarea>
                </div>
                <div class="setting-fav-text-column">
                  タイトル・説明文
                  <textarea
                    class="setting-form"
                    data-config-name="word"
                    data-config-namespace="fav"
                  ></textarea>
                </div>
               </div>

             </div>

            <div class="footer-menu">
              <div class="close-setting-menu">
                <button
                  class="pocket-button command"
                  data-command="toggle-setting"
                >戻 る</button>
              </div>
            </div>

          </div>
        </div>
      </template>
    `).trim();

    const __ng_css__ = `
      /* .item_cell 将棋盤ランキング  .item 従来のランキングと検索 */

      .VideoItem.NC-VideoCard.is-ng-rejected,
      .item_cell.is-ng-rejected {
       opacity: 0;
       pointer-events: none;
       visibility: hidden;
      } 

      .VideoItem.VideoCard.is-ng-rejected,
      .item_cell.is-ng-rejected {
       opacity: 0;
       pointer-events: none;
       visibility: hidden;
      } 

      .RankingMainVideo.is-ng-wait,
      .RankingBaseItem.is-ng-wait,
      .item_cell.is-ng-wait .item,
      .item.is-ng-wait {
        outline: 1px dotted rgba(192, 192, 192, 0.8);
      }

      .RankingMainVideo.is-ng-queue,
      .RankingBaseItem.is-ng-queue,
      .item_cell.is-ng-queue .item,
      .item.is-ng-queue {
        outline: 2px dotted rgba(192, 192, 192, 0.8);
      }

      .RankingMainVideo.is-ng-current,
      .RankingBaseItem.is-ng-current,
      .item_cell.is-ng-current .item,
      .item.is-ng-current {
        outline: 3px dotted rgba(128, 225, 128, 0.8);
      }

      .RankingMainVideo.is-ng-resolved,
      .RankingBaseItem.is-ng-resolved,
      .item_cell.is-ng-resolved .item,
      .item.is-ng-resolved {
        outline: 0px solid green;
      }

      .RankingMainVideo.is-ng-favorited,
      .RankingBaseItem.is-ng-favorited,
      .item_cell.is-fav-favorited .item,
      .item.is-fav-favorited {
        outline: 3px dotted orange;
        outline-offset: 3px;
      }
      .item.videoRanking.is-fav-favorited {
        outline-offset: -3px;
      }

      .RankingBaseItem.is-ng-rejected,
      .item_cell.is-ng-rejected {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      }

      .VideoItem .VideoItem-postDate {
        line-height: 16px;
        vertical-align: top;
        font-size: 12px;
        color: #666;
      }

      .RankingMainVideo.is-ng-rejected,
      .item.is-ng-rejected {
        display: none;
        opacity: 0;
        pointer-events: none;
      }

      .NicorepoTimelineItem.is-ng-rejected {
        display: none;
        opacity: 0;
        pointer-events: none;
      }

      body.is-ng-disable .is-ng-rejected {
        outline: none;
        display: block !important;
        pointer-events: auto;
        opacity: 0.5;
        visibility: visible;
      }

      /* チャンネル検索 */
        #search .item.is-ng-rejected {
          display: none;
        }
    `;

    // TODO: ライブラリ化
    const util = MylistPocket.util = (() => {
      const util = {};

      util.mixin = function(self, o) {
        Object.keys(o).forEach(f => {
          if (!_.isFunction(o[f])) { return; }
          if (_.isFunction(self[f])) { return; }
          self[f] = o[f].bind(o);
        });
      };
      util.attachShadowDom = function({host, tpl, mode = 'open'}) {
        const root = host.attachShadow ?
          host.attachShadow({mode}) : host.createShadowRoot();
        const node = document.importNode(tpl.content, true);
        root.appendChild(node);
        return root;
      };
      util.httpLink = function(html) {
        let links = {}, keyCount = 0;
        const getTmpKey = function() { return ` <!--${keyCount++}--> `; };
        html = html.replace(/@([a-zA-Z0-9_]+)/g,
          (g, id) => {
            const tmpKey = getTmpKey();
            links[tmpKey] =
              ` <a href="https://twitter.com/${id}" class="twitterLink" rel="noopener" target="_blank">@${id}</a> `;
            return tmpKey;
          });


        html = html.replace(/(https?:\/\/seiga\.nicovideo\.jp\/seiga\/)?im(\d+)/g,
          ' <a href="//seiga.nicovideo.jp/seiga/im$2" class="seigaLink" rel="noopener" target="_blank">$1im$2</a> ');
        html = html.replace(/(https?:\/\/com\.nicovideo\.jp\/community\/)?co(\d+)/g,
          ' <a href="//com.nicovideo.jp/community/co$2" class="communityLink" rel="noopener" target="_blank">$1co$2</a> ');
        html = html.replace(/(https?:\/\/www\.nicovideo\.jp\/)?(watch|mylist|series|user)\/(\d+)/g,
          ' <a href="https://www.nicovideo.jp/$2/$3" rel="noopener" class="videoLink target-change">$1$2/$3</a> ');
        html = html.replace(/(https?:\/\/www\.nicovideo\.jp\/watch\/)?(sm|nm|so)(\d+)/g,
          ' <a href="https://www.nicovideo.jp/watch/$2$3" rel="noopener" class="videoLink target-change">$1$2$3</a> ');

        let linkmatch = /<a.*?<\/a>/, n;
        html = html.split('<br />').join(' <br /> ');
        while ((n = linkmatch.exec(html)) !== null) {
          let tmpKey = getTmpKey();
          links[tmpKey] = n;
          html = html.replace(n, tmpKey);
        }

        html = html.replace(/\((https?:\/\/[\x21-\x3b\x3d-\x7e]+)\)/gi, '( $1 )');
        html = html.replace(/(https?:\/\/[\x21-\x3b\x3d-\x7e]+)http/gi, '$1 http');
        html = html.replace(/(https?:\/\/[\x21-\x3b\x3d-\x7e]+)/gi, '<a href="$1" rel="noopener" target="_blank" class="otherSite">$1</a>');
        Object.keys(links).forEach(tmpKey => {
          html = html.replace(tmpKey, links[tmpKey]);
        });

        html = html.split(' <br /> ').join('<br />');
        return html;
      };

      util.getSleepPromise = function(sleepTime, label = 'sleep') {
        return function(result) {
          return new Promise(resolve => {
            window.setTimeout(() => {
              return resolve(result);
            }, sleepTime);
          });
        };
      };

      util.isFirefox = () =>
        navigator.userAgent.toLowerCase().indexOf('firefox') >= 0;

      return util;
    })();
const bounce = {
	origin: Symbol('origin'),
	idle(func, time) {
		let reqId = null;
		let lastArgs = null;
		let promise = new PromiseHandler();
		const [caller, canceller] =
			(time === undefined && self.requestIdleCallback) ?
				[self.requestIdleCallback, self.cancelIdleCallback] : [self.setTimeout, self.clearTimeout];
		const callback = () => {
			const lastResult = func(...lastArgs);
			promise.resolve({lastResult, lastArgs});
			reqId = lastArgs = null;
			promise = new PromiseHandler();
		};
		const result = (...args) => {
			if (reqId) {
				reqId = canceller(reqId);
			}
			lastArgs = args;
			reqId = caller(callback, time);
			return promise;
		};
		result[this.origin] = func;
		return result;
	},
	time(func, time = 0) {
		return this.idle(func, time);
	}
};
const throttle = (func, interval) => {
	let lastTime = 0;
	let timer;
	let promise = new PromiseHandler();
	const result = (...args) => {
		if (timer) {
			return promise;
		}
		const now = performance.now();
		const timeDiff = now - lastTime;
		timer = setTimeout(() => {
			lastTime = performance.now();
			timer = null;
			const lastResult = func(...args);
			promise.resolve({lastResult, lastArgs: args});
			promise = new PromiseHandler();
		}, Math.max(interval - timeDiff, 0));
		return promise;
	};
	result.cancel = () => {
		if (timer) {
			timer = clearTimeout(timer);
		}
		promise.resolve({lastResult: null, lastArgs: null});
		promise = new PromiseHandler();
	};
	return result;
};
throttle.time = (func, interval = 0) => throttle(func, interval);
throttle.raf = function(func) {
	let promise;
	let cancelled = false;
	let lastArgs = [];
	const callRaf = res => requestAnimationFrame(res);
	const onRaf = () => this.req = null;
	const onCall = () => {
		if (cancelled) {
			cancelled = false;
			return;
		}
		try { func(...lastArgs); } catch (e) { console.warn(e); }
		promise = null;
	};
	const result = (...args) => {
		lastArgs = args;
		if (promise) {
			return promise;
		}
		if (!this.req) {
			this.req = new Promise(callRaf).then(onRaf);
		}
		promise = this.req.then(onCall);
		return promise;
	};
	result.cancel = () => {
		cancelled = true;
		promise = null;
	};
	return result;
}.bind({req: null, count: 0, id: 0});
throttle.idle = func => {
	let id;
	const request = (self.requestIdleCallback || self.setTimeout);
	const cancel = (self.cancelIdleCallback || self.clearTimeout);
	const result = (...args) => {
		if (id) {
			return;
		}
		id = request(() => {
			id = null;
			func(...args);
		}, 0);
	};
	result.cancel = () => {
		if (id) {
			id = cancel(id);
		}
	};
	return result;
};
const css = (() => {
	const setPropsTask = [];
	const applySetProps = throttle.raf(
		() => {
		const tasks = setPropsTask.concat();
		setPropsTask.length = 0;
		for (const [element, prop, value] of tasks) {
			try {
				element.style.setProperty(prop, value);
			} catch (error) {
				console.warn('element.style.setProperty fail', {element, prop, value, error});
			}
		}
	});
	const css = {
		addStyle: (styles, option, document = window.document) => {
			const elm = Object.assign(document.createElement('style'), {
				type: 'text/css'
			}, typeof option === 'string' ? {id: option} : (option || {}));
			if (typeof option === 'string') {
				elm.id = option;
			} else if (option) {
				Object.assign(elm, option);
			}
			elm.classList.add(global.PRODUCT);
			elm.append(styles.toString());
			(document.head || document.body || document.documentElement).append(elm);
			elm.disabled = option && option.disabled;
			elm.dataset.switch = elm.disabled ? 'off' : 'on';
			return elm;
		},
		registerProps(...args) {
			if (!CSS || !('registerProperty' in CSS)) {
				return;
			}
			for (const definition of args) {
				try {
					(definition.window || window).CSS.registerProperty(definition);
				} catch (err) { console.warn('CSS.registerProperty fail', definition, err); }
			}
		},
		setProps(...tasks) {
			setPropsTask.push(...tasks);
			return setPropsTask.length ? applySetProps() : Promise.resolve();
		},
		addModule: async function(func, options = {}) {
			if (!CSS || !('paintWorklet' in CSS) || this.set.has(func)) {
				return;
			}
			this.set.add(func);
			const src =
			`(${func.toString()})(
				this,
				registerPaint,
				${JSON.stringify(options.config || {}, null, 2)}
				);`;
			const blob = new Blob([src], {type: 'text/javascript'});
			const url = URL.createObjectURL(blob);
			await CSS.paintWorklet.addModule(url).then(() => URL.revokeObjectURL(url));
			return true;
		}.bind({set: new WeakSet}),
		escape:  value => CSS.escape  ? CSS.escape(value) : value.replace(/([\.#()[\]])/g, '\\$1'),
		number:  value => CSS.number  ? CSS.number(value) : value,
		s:       value => CSS.s       ? CSS.s(value) :  `${value}s`,
		ms:      value => CSS.ms      ? CSS.ms(value) : `${value}ms`,
		pt:      value => CSS.pt      ? CSS.pt(value) : `${value}pt`,
		px:      value => CSS.px      ? CSS.px(value) : `${value}px`,
		percent: value => CSS.percent ? CSS.percent(value) : `${value}%`,
		vh:      value => CSS.vh      ? CSS.vh(value) : `${value}vh`,
		vw:      value => CSS.vw      ? CSS.vw(value) : `${value}vw`,
		trans:   value => self.CSSStyleValue ? CSSStyleValue.parse('transform', value) : value,
		word:    value => self.CSSKeywordValue ? new CSSKeywordValue(value) : value,
		image:   value => self.CSSStyleValue ? CSSStyleValue.parse('background-image', value) : value,
	};
	return css;
})();
const cssUtil = css;
Object.assign(util, css);
Object.assign(util, workerUtil);
const nicoUtil = {
	parseWatchQuery: query => {
		try {
			const result = textUtil.parseQuery(query);
			const playlist = JSON.parse(result.playlist && textUtil.decodeBase64(result.playlist) || '{}');
			const context = playlist.context;
			result.playlist = { type: playlist.type };
			switch (playlist.type) {
				case 'series':
					Object.assign(result.playlist, { id: context.seriesId });
					break;
				case 'user-uploaded': {
					const { userId, ...options } = context;
					Object.assign(result.playlist, { id: userId, options });
					break;
				}
				case 'mylist': {
					const { mylistId, ...options } = context;
					Object.assign(result.playlist, { id: mylistId, options });
					break;
				}
				case 'watchlater':
				case 'search':
					Object.assign(result.playlist, { options: context });
					break;
			}
			return result;
		} catch(e) {
			return {};
		}
	},
	hasLargeThumbnail: videoId => {
		const threthold = 16371888;
		const cid = videoId.substr(0, 2);
		const fid = videoId.substr(2) * 1;
		if (cid === 'nm') { return false; }
		if (cid !== 'sm' && fid < 35000000) { return false; }
		if (fid < threthold) {
			return false;
		}
		return true;
	},
	getThumbnailUrlByVideoId: videoId => {
		const videoIdReg = /^[a-z]{2}\d+$/;
		if (!videoIdReg.test(videoId)) {
			return null;
		}
		const fileId = parseInt(videoId.substr(2), 10);
		const large = nicoUtil.hasLargeThumbnail(videoId) ? '.L' : '';
		return fileId >= 35374758 ? // このIDから先は新サーバー(おそらく)
			`https://nicovideo.cdn.nimg.jp/thumbnails/${fileId}/${fileId}.L` :
			`https://tn.smilevideo.jp/smile?i=${fileId}.${large}`;
	},
	getWatchId: url => {
		let m;
		if (url && url.indexOf('nico.ms') >= 0) {
			m = /\/\/nico\.ms\/([a-z0-9]+)/.exec(url);
		} else {
			m = /\/?watch\/([a-z0-9]+)/.exec(url || location.pathname);
		}
		return m ? m[1] : null;
	},
	getCommonHeader: () => {
		try { // hoge?.fuga... はGreasyforkの文法チェックで弾かれるのでまだ使えない
			return JSON.parse(document.querySelector('#CommonHeader[data-common-header]').dataset.commonHeader || '{}');
		} catch (e) {
			return {initConfig: {}};
		}
	},
	isLegacyHeader: () => !document.querySelector('#CommonHeader[data-common-header]'),
	isPremiumLegacy: () => {
		const a = 'a[href^="https://account.nicovideo.jp/premium/register"]';
		return !document.querySelector(`#topline ${a}, #CommonHeader ${a}`);
},
isLoginLegacy: () => {
		const a = 'a[href^="https://account.nicovideo.jp/login"]';
		return !document.querySelector(`#topline ${a}, #CommonHeader ${a}`);
	},
	isPremium: () =>
		nicoUtil.isLegacyHeader() ? nicoUtil.isPremiumLegacy() :
			!!nicoUtil.getCommonHeader().initConfig.user.isPremium,
	isLogin: () =>
		nicoUtil.isLegacyHeader() ? nicoUtil.isLoginLegacy() :
			!!nicoUtil.getCommonHeader().initConfig.user.isLogin,
	getPageLanguage: () => {
		try {
			let h = document.getElementsByClassName('html')[0];
			return h.lang || 'ja-JP';
		} catch (e) {
			return 'ja-JP';
		}
	},
	openMylistWindow: watchId => {
		window.open(
			`//www.nicovideo.jp/mylist_add/video/${watchId}`,
			'nicomylistadd',
			'width=500, height=400, menubar=no, scrollbars=no');
	},
	openTweetWindow: ({watchId, duration, isChannel, title, videoId}) => {
		const nicomsUrl = `https://nico.ms/${watchId}`;
		const watchUrl = `https://www.nicovideo.jp/watch/${watchId}`;
		title = `${title}(${textUtil.secToTime(duration)})`.replace(/@/g, '@ ');
		const nicoch = isChannel ? ',+nicoch' : '';
		const url =
			'https://twitter.com/intent/tweet?' +
			'url=' + encodeURIComponent(nicomsUrl) +
			'&text=' + encodeURIComponent(title) +
			'&hashtags=' + encodeURIComponent(videoId + nicoch) +
			'&original_referer=' + encodeURIComponent(watchUrl) +
			'';
		window.open(url, '_blank', 'width=550, height=480, left=100, top50, personalbar=0, toolbar=0, scrollbars=1, sizable=1', 0);
	},
	isGinzaWatchUrl: url => /^https?:\/\/www\.nicovideo\.jp\/watch\//.test(url || location.href),
	getPlayerVer: () => {
		if (document.getElementById('js-initial-watch-data')) {
			return 'html5';
		}
		if (document.getElementById('watchAPIDataContainer')) {
			return 'flash';
		}
		return 'unknown';
	},
	isZenzaPlayableVideo: () => {
		try {
			if (nicoUtil.getPlayerVer() === 'html5') {
				return true;
			}
			const watchApiData = JSON.parse(document.querySelector('#watchAPIDataContainer').textContent);
			const flvInfo = textUtil.parseQuery(
				decodeURIComponent(watchApiData.flashvars.flvInfo)
			);
			const dmcInfo = JSON.parse(
				decodeURIComponent(watchApiData.flashvars.dmcInfo || '{}')
			);
			const videoUrl = flvInfo.url ? flvInfo.url : '';
			const isDmc = dmcInfo && dmcInfo.time;
			if (isDmc) {
				return true;
			}
			const isSwf = /\/smile\?s=/.test(videoUrl);
			const isRtmp = (videoUrl.indexOf('rtmp') === 0);
			return (isSwf || isRtmp) ? false : true;
		} catch (e) {
			return false;
		}
	},
	getNicoHistory: window.decodeURIComponent(document.cookie.replace(/^.*(nicohistory[^;+]).*?/, '')),
	getMypageVer: () => document.querySelector('#js-initial-userpage-data') ? 'spa' : 'legacy'
};
Object.assign(util, nicoUtil);
const netUtil = {
	ajax: params => {
		if (location.host !== 'www.nicovideo.jp') {
			return NicoVideoApi.ajax(params);
		}
		return $.ajax(params);
	},
	abortableFetch: (url, params) => {
		params = params || {};
		const racers = [];
		let timer;
		const timeout = (typeof params.timeout === 'number' && !isNaN(params.timeout)) ? params.timeout : 30 * 1000;
		if (timeout > 0) {
			racers.push(new Promise((resolve, reject) =>
				timer = setTimeout(() => timer ? reject({name: 'timeout', message: 'timeout'}) : resolve(), timeout))
			);
		}
		const controller = window.AbortController ? (new AbortController()) : null;
		if (controller) {
			params.signal = controller.signal;
		}
		racers.push(fetch(url, params));
		return Promise.race(racers)
			.catch(err => {
				if (err.name === 'timeout') {
					if (controller) {
						controller.abort();
					}
				}
				return Promise.reject(err.message || err);
			}).finally(() => timer = null);
	},
	fetch(url, params) {
		if (location.host !== 'www.nicovideo.jp') {
			return NicoVideoApi.fetch(url, params);
		}
		return this.abortableFetch(url, params);
	},
	jsonp: (() => {
		let callbackId = 0;
		const getFuncName = () => `JsonpCallback${callbackId++}`;
		let cw = null;
		const getFrame = () => {
			if (cw) { return cw; }
			return new Promise(resolve => {
				const iframe = document.createElement('iframe');
				iframe.srcdoc = `
					<html><head></head></html>
				`.trim();
				iframe.sandbox = 'allow-same-origin allow-scripts';
				Object.assign(iframe.style, {
					width: '32px', height: '32px', position: 'fixed', left: '-100vw', top: '-100vh',
					pointerEvents: 'none', overflow: 'hidden'
				});
				iframe.onload = () => {
					cw = iframe.contentWindow;
					resolve(cw);
				};
				(document.body || document.documentElement).append(iframe);
			});
		};
		const createFunc = async (url, funcName) => {
			let timeoutTimer = null;
			const win = await getFrame();
			const doc = win.document;
			const script = doc.createElement('script');
			return new Promise((resolve, reject) => {
				win[funcName] = result => {
					win.clearTimeout(timeoutTimer);
					timeoutTimer = null;
					script.remove();
					delete win[funcName];
					resolve(result);
				};
				timeoutTimer = win.setTimeout(() => {
					script.remove();
					delete win[funcName];
					if (timeoutTimer) {
						reject(new Error(`jsonp timeout ${url}`));
					}
				}, 30000);
				script.src = url;
				doc.head.append(script);
			});
		};
		return (url, funcName) => {
			if (!funcName) {
				funcName = getFuncName();
			}
			url = `${url}${url.includes('?') ? '&' : '?'}callback=${funcName}`;
			return createFunc(url, funcName);
		};
	})()
};
Object.assign(util, netUtil);
const textUtil = {
	secToTime: sec => {
		return [
			Math.floor(sec / 60).toString().padStart(2, '0'),
			(Math.floor(sec) % 60).toString().padStart(2, '0')
		].join(':');
	},
	parseQuery: (query = '') => {
		query = query.startsWith('?') ? query.substr(1) : query;
		const result = {};
		query.split('&').forEach(item => {
			const sp = item.split('=');
			const key = decodeURIComponent(sp[0]);
			const val = decodeURIComponent(sp.slice(1).join('='));
			result[key] = val;
		});
		return result;
	},
	parseUrl: url => {
		url = url || 'https://unknown.example.com/';
		return Object.assign(document.createElement('a'), {href: url});
	},
	decodeBase64: str => {
		try {
			return decodeURIComponent(
				escape(atob(
					str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
				)));
		} catch(e) {
			return '';
		}
	},
	encodeBase64: str => {
		try {
			return btoa(unescape(encodeURIComponent(str)));
		} catch(e) {
			return '';
		}
	},
	escapeHtml: text => {
		const map = {
			'&': '&amp;',
			'\x27': '&#39;',
			'"': '&quot;',
			'<': '&lt;',
			'>': '&gt;'
		};
		return text.replace(/[&"'<>]/g, char => map[char]);
	},
	unescapeHtml: text => {
		const map = {
			'&amp;': '&',
			'&#39;': '\x27',
			'&quot;': '"',
			'&lt;': '<',
			'&gt;': '>'
		};
		return text.replace(/(&amp;|&#39;|&quot;|&lt;|&gt;)/g, char => map[char]);
	},
	escapeToZenkaku: text => {
		const map = {
			'&': '＆',
			'\'': '’',
			'"': '”',
			'<': '＜',
			'>': '＞'
		};
		return text.replace(/["'<>]/g, char => map[char]);
	},
	escapeRegs: text => {
		const match = /[\\^$.*+?()[\]{}|]/g;
		return text.replace(match, '\\$&');
	},
	convertKansuEi: text => {
		let match = /[〇一二三四五六七八九零壱弐惨伍]/g;
		let map = {
			'〇': '0', '零': '0',
			'一': '1', '壱': '1',
			'二': '2', '弐': '2',
			'三': '3', '惨': '3',
			'四': '4',
			'五': '5', '伍': '5',
			'六': '6',
			'七': '7',
			'八': '8',
			'九': '9',
		};
		text = text.replace(match, char => map[char]);
		text = text.replace(/([1-9]?)[十拾]([0-9]?)/g, (n, a, b) => (a && b) ? `${a}${b}` : (a ? a * 10 : 10 + b * 1));
		return text;
	},
	dateToString: date => {
		if (typeof date === 'string') {
			const origDate = date;
			date = date.replace(/\//g, '-');
			const m = /^(\d+-\d+-\d+) (\d+):(\d+):(\d+)/.exec(date);
			if (m) {
				date = new Date(m[1]);
				date.setHours(m[2]);
				date.setMinutes(m[3]);
				date.setSeconds(m[4]);
			} else {
				const t = Date.parse(date);
				if (isNaN(t)) {
					return origDate;
				}
				date = new Date(t);
			}
		} else if (typeof date === 'number') {
			date = new Date(date);
		}
		if (!date || isNaN(date.getTime())) {
			return '1970/01/01 00:00:00';
		}
		const [yy, mm, dd, h, m, s] = [
				date.getFullYear(),
				date.getMonth() + 1,
				date.getDate(),
				date.getHours(),
				date.getMinutes(),
				date.getSeconds()
			].map(n => n.toString().padStart(2, '0'));
		return `${yy}/${mm}/${dd} ${h}:${m}:${s}`;
	},
	isValidJson: data => {
		try {
			JSON.parse(data);
			return true;
		} catch (e) {
			return false;
		}
	},
	toRgba: (c, alpha = 1) =>
		`rgba(${parseInt(c.substr(1, 2), 16)}, ${parseInt(c.substr(3, 2), 16)}, ${parseInt(c.substr(5, 2), 16)}, ${alpha})`,
	snakeToCamel: snake => snake.replace(/-./g, s => s.charAt(1).toUpperCase()),
	camelToSnake: (camel, separator = '_') => camel.replace(/([A-Z])/g, s =>  separator + s.toLowerCase())
};
Object.assign(util, textUtil);
const reg = (() => {
	const $ = Symbol('$');
	const undef = Symbol.for('undefined');
	const MAX_RESULT = 30;
	const smap = new WeakMap();
	const self = {};
	const reg = function(regex = undef, str = undef) {
		const {results, last} = smap.has(this) ?
			smap.get(this) : {results: [], last: {result: null}};
		smap.set(this, {results, last});
		if (regex === undef) {
			return last ? last.result : null;
		}
		const regstr = regex.toString();
		if (str !== undef) {
			const found = results.find(r => regstr === r.regstr && str === r.str);
			return found ? found.result : reg(regex).exec(str);
		}
		return {
			exec(str) {
				const result = regex.exec(str);
				Array.isArray(result) && result.forEach((r, i) => result['$' + i] = r);
				Object.assign(last, {str, regstr, result});
				results.push(last);
				results.length > MAX_RESULT && results.shift();
				this[$] = str[$] = regex[$] = result;
				return result;
			},
			test(str) { return !!this.exec(str); }
		};
	};
	const scope = (scopeObj = {}) => reg.bind(scopeObj);
	return Object.assign(reg.bind(self), {$, scope});
})();

    MylistPocket.emitter = util.emitter = new Emitter();

    const ZenzaDetector = (function() {
      let isReady = false;
      let Zenza = null;
      const emitter = new Emitter();

      const initialize = function() {
        const onZenzaReady = () => {
          isReady = true;
          Zenza = window.ZenzaWatch;

          Zenza.emitter.on('hideHover', () => {
            util.emitter.emit('hideHover');
          });

          Zenza.emitter.on('csrfToken', (token) => {
            util.emitter.emit('csrfToken', token);
          });

          let popup = document.getElementById('mylistPocket-popup');
          let defaultContainer = document.getElementById('mylistPocketDomContainer');
          defaultContainer.classList.add('zen-family');
          let zenzaContainer;
          Zenza.emitter.on('fullScreenStatusChange', isFull => {
            if (isFull) {
              if (!zenzaContainer) {
                zenzaContainer = document.querySelector('.zenzaPlayerContainer');
              }
              zenzaContainer.appendChild(popup);
            } else {
              defaultContainer.appendChild(popup);
            }
          });
          emitter.emit('ready', Zenza);
        };

        if (window.ZenzaWatch && window.ZenzaWatch.ready) {
          window.console.log('ZenzaWatch is Ready');
          onZenzaReady();
        } else {
          document.body.addEventListener('ZenzaWatchInitialize', function() {
            window.console.log('ZenzaWatchInitialize MylistPocket');
            onZenzaReady();
          });
        }
      };

      const detect = function() {
        return new Promise(res => {
          if (isReady) {
            return res(Zenza);
          }
          emitter.on('ready', () => {
            res(Zenza);
          });
        });
      };

      return {
        initialize: initialize,
        detect: detect
      };

    })();
const objUtil = (() => {
	const isObject = e => e !== null && e instanceof Object;
	const PROPS = Symbol('PROPS');
	const REVISION = Symbol('REVISION');
	const CHANGED = Symbol('CHANGED');
	const HAS = Symbol('HAS');
	const SET = Symbol('SET');
	const GET = Symbol('GET');
	return {
		bridge: (self, target, keys = null) => {
			(keys || Object.getOwnPropertyNames(target.constructor.prototype))
				.filter(key => typeof target[key] === 'function')
				.forEach(key => self[key] = target[key].bind(target));
		},
		isObject,
		toMap: (obj, mapper = Map) => {
			if (obj instanceof mapper) {
				return obj;
			}
			return new mapper(Object.entries(obj));
		},
		mapToObj: map => {
			if (!(map instanceof Map)) {
				return map;
			}
			const obj = {};
			for (const [key, val] of map) {
				obj[key] = val;
			}
			return obj;
		},
	};
})();
const StorageWriter = (() => {
	const func = function(self) {
		self.onmessage = ({command, params}) => {
			const {obj, replacer, space} = params;
			return JSON.stringify(obj, replacer || null, space || 0);
		};
	};
	let worker;
	const prototypePollution = window.Prototype && Array.prototype.hasOwnProperty('toJSON');
	const toJson = async (obj, replacer = null, space = 0) => {
		if (!prototypePollution || obj === null || ['string', 'number', 'boolean'].includes(typeof obj)) {
			return JSON.stringify(obj, replacer, space);
		}
		worker = worker || workerUtil.createCrossMessageWorker(func, {name: 'ToJsonWorker'});
		return worker.post({command: 'toJson', params: {obj, replacer, space}});
	};
	const writer = Symbol('StorageWriter');
	const setItem = (storage, key, value) => {
		if (!prototypePollution || value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
			storage.setItem(key, JSON.stringify(value));
		} else {
			toJson(value).then(json => storage.setItem(key, json));
		}
	};
	localStorage[writer] = (key, value) => setItem(localStorage, key, value);
	sessionStorage[writer] = (key, value) => setItem(sessionStorage, key, value);
	return { writer, toJson };
})();
const Observable = (() => {
	const observableSymbol = Symbol.observable || Symbol('observable');
	const nop = Handler.nop;
	class Subscription {
		constructor({observable, subscriber, unsubscribe, closed}) {
			this.callbacks = {unsubscribe, closed};
			this.observable = observable;
			const next = subscriber.next.bind(subscriber);
			subscriber.next = args => {
				if (this.closed || (this._filterFunc && !this._filterFunc(args))) {
					return;
				}
				return this._mapFunc ? next(this._mapFunc(args)) : next(args);
			};
			this._closed = false;
		}
		subscribe(subscriber, onError, onCompleted) {
			return this.observable.subscribe(subscriber, onError, onCompleted)
				.filter(this._filterFunc)
				.map(this._mapFunc);
		}
		unsubscribe() {
			this._closed = true;
			if (this.callbacks.unsubscribe) {
				this.callbacks.unsubscribe();
			}
			return this;
		}
		dispose() {
			return this.unsubscribe();
		}
		filter(func) {
			const _func = this._filterFunc;
			this._filterFunc = _func ? (arg => _func(arg) && func(arg)) : func;
			return this;
		}
		map(func) {
			const _func = this._mapFunc;
			this._mapFunc = _func ? arg => func(_func(arg)) : func;
			return this;
		}
		get closed() {
			if (this.callbacks.closed) {
				return this._closed || this.callbacks.closed();
			} else {
				return this._closed;
			}
		}
	}
	class Subscriber {
		static create(onNext = null, onError = null, onCompleted = null) {
			if (typeof onNext === 'function') {
				return new this({
					next: onNext,
					error: onError,
					complete: onCompleted
				});
			}
			return new this(onNext || {});
		}
		constructor({start, next, error, complete} = {start:nop, next:nop, error:nop, complete:nop}) {
			this.callbacks = {start, next, error, complete};
		}
		start(arg) {this.callbacks.start(arg);}
		next(arg) {this.callbacks.next(arg);}
		error(arg) {this.callbacks.error(arg);}
		complete(arg) {this.callbacks.complete(arg);}
		get closed() {
			return this._callbacks.closed ? this._callbacks.closed() : false;
		}
	}
	Subscriber.nop = {start: nop, next: nop, error: nop, complete: nop, closed: nop};
	const eleMap = new WeakMap();
	class Observable {
		static of(...args) {
			return new this(o => {
				for (const arg of args) {
					o.next(arg);
				}
				o.complete();
				return () => {};
			});
		}
		static from(arg) {
			if (arg[Symbol.iterator]) {
				return this.of(...arg);
			} else if (arg[Observable.observavle]) {
				return arg[Observable.observavle]();
			}
		}
		static fromEvent(element, eventName) {
			const em = eleMap.get(element) || {};
			if (em && em[eventName]) {
				return em[eventName];
			}
			eleMap.set(element, em);
			return em[eventName] = new this(o => {
				const onUpdate = e => o.next(e);
				element.addEventListener(eventName, onUpdate, {passive: true});
				return () => element.removeEventListener(eventName, onUpdate);
			});
		}
		static interval(ms) {
			return new this(function(o) {
				const timer = setInterval(() => o.next(this.i++), ms);
				return () => clearInterval(timer);
			}.bind({i: 0}));
		}
		constructor(subscriberFunction) {
			this._subscriberFunction = subscriberFunction;
			this._completed = false;
			this._cancelled = false;
			this._handlers = new Handler();
		}
		_initSubscriber() {
			if (this._subscriber) {
				return;
			}
			const handlers = this._handlers;
			this._completed = this._cancelled = false;
			return this._subscriber = new Subscriber({
				start: arg => handlers.execMethod('start', arg),
				next: arg => handlers.execMethod('next', arg),
				error: arg => handlers.execMethod('error', arg),
				complete: arg => {
					if (this._nextObservable) {
						this._nextObservable.subscribe(this._subscriber);
						this._nextObservable = this._nextObservable._nextObservable;
					} else {
						this._completed = true;
						handlers.execMethod('complete', arg);
					}
				},
				closed: () => this.closed
			});
		}
		get closed() {
			return this._completed || this._cancelled;
		}
		filter(func) {
			return this.subscribe().filter(func);
		}
		map(func) {
			return this.subscribe().map(func);
		}
		concat(arg) {
			const observable = Observable.from(arg);
			if (this._nextObservable) {
				this._nextObservable.concat(observable);
			} else {
				this._nextObservable = observable;
			}
			return this;
		}
		forEach(callback) {
			let p = new PromiseHandler();
			callback(p);
			return this.subscribe({
				next: arg => {
					const lp = p;
					p = new PromiseHandler();
					lp.resolve(arg);
					callback(p);
				},
				error: arg => {
					const lp = p;
					p = new PromiseHandler();
					lp.reject(arg);
					callback(p);
			}});
		}
		onStart(arg) { this._subscriber.start(arg); }
		onNext(arg) { this._subscriber.next(arg); }
		onError(arg) { this._subscriber.error(arg); }
		onComplete(arg) { this._subscriber.complete(arg);}
		disconnect() {
			if (!this._disconnectFunction) {
				return;
			}
			this._closed = true;
			this._disconnectFunction();
			delete this._disconnectFunction;
			this._subscriber;
			this._handlers.clear();
		}
		[observableSymbol]() {
			return this;
		}
		subscribe(onNext = null, onError = null, onCompleted = null) {
			this._initSubscriber();
			const isNop = [onNext, onError, onCompleted].every(f => f === null);
			const subscriber = Subscriber.create(onNext, onError, onCompleted);
			return this._subscribe({subscriber, isNop});
		}
		_subscribe({subscriber, isNop}) {
			if (!isNop && !this._disconnectFunction) {
				this._disconnectFunction = this._subscriberFunction(this._subscriber);
			}
			!isNop && this._handlers.add(subscriber);
			return new Subscription({
				observable: this,
				subscriber,
				unsubscribe: () => {
					if (isNop) { return; }
					this._handlers.remove(subscriber);
					if (this._handlers.isEmpty) {
						this.disconnect();
					}
				},
				closed: () => this.closed
			});
		}
	}
	Observable.observavle = observableSymbol;
	return Observable;
})();
const WindowResizeObserver = Observable.fromEvent(window, 'resize')
	.map(o => { return {width: window.innerWidth, height: window.innerHeight}; });
// already required
class DataStorage {
	static create(defaultData, options = {}) {
		return new DataStorage(defaultData, options);
	}
	static clone(dataStorage) {
		const options = {
			prefix:  dataStorage.prefix,
			storage: dataStorage.storage,
			ignoreExportKeys: dataStorage.options.ignoreExportKeys,
			readonly: dataStorage.readonly
		};
		return DataStorage.create(dataStorage.default, options);
	}
	constructor(defaultData, options = {}) {
		this.options = options;
		this.default = defaultData;
		this._data = Object.assign({}, defaultData);
		this.prefix = `${options.prefix || 'DATA'}_`;
		this.storage = options.storage || localStorage;
		this._ignoreExportKeys = options.ignoreExportKeys || [];
		this.readonly = options.readonly;
		this.silently = false;
		this._changed = new Map();
		this._onChange = bounce.time(this._onChange.bind(this));
		objUtil.bridge(this, new Emitter());
		this.restore().then(() => {
			this.props = this._makeProps(defaultData);
			this.emitResolve('restore');
		});
		this.logger = (self || window).console;
		this.consoleSubscriber = {
			next: (v, ...args) => this.logger.log('next', v, ...args),
			error: (e, ...args) => this.logger.warn('error', e, ...args),
			complete: (c, ...args) => this.logger.log('complete', c, ...args)
		};
	}
	_makeProps(defaultData = {}, namespace = '') {
		namespace = namespace ? `${namespace}.` : '';
		const self = this;
		const def = {};
		const props = {};
		Object.keys(defaultData).sort()
			.filter(key => key.includes(namespace))
			.forEach(key => {
				const k = key.slice(namespace.length);
				if (k.includes('.')) {
					const ns = k.slice(0, k.indexOf('.'));
					props[ns] = this._makeProps(defaultData, `${namespace}${ns}`);
				}
				def[k] = {
					enumerable: !this._ignoreExportKeys.includes(key),
					get() { return self.getValue(key); },
					set(v) { self.setValue(key, v); }
				};
		});
		Object.defineProperties(props, def);
		return props;
	}
	_onChange() {
		const changed = this._changed;
		this.emit('change', changed);
		for (const [key, val] of changed) {
			this.emitAsync('update', key, val);
			this.emitAsync(`update-${key}`, val);
		}
		this._changed.clear();
	}
	onkey(key, callback) {
		this.on(`update-${key}`, callback);
	}
	offkey(key, callback) {
		this.off(`update-${key}`, callback);
	}
	async restore(storage) {
		storage = storage || this.storage;
		Object.keys(this.default).forEach(key => {
			const storageKey = this.getStorageKey(key);
			if (storage.hasOwnProperty(storageKey) || storage[storageKey] !== undefined) {
				try {
					this._data[key] = JSON.parse(storage[storageKey]);
				} catch (e) {
					console.error('config parse error key:"%s" value:"%s" ', key, storage[storageKey], e);
					delete storage[storageKey];
					this._data[key] = this.default[key];
				}
			} else {
				this._data[key] = this.default[key];
			}
		});
	}
	getNativeKey(key) {
		return key;
	}
	getStorageKey(key) {
		return `${this.prefix}${key}`;
	}
	async refresh(key, storage) {
		storage = storage || this.storage;
		key = this.getNativeKey(key);
		const storageKey = this.getStorageKey(key);
		if (storage.hasOwnProperty(storageKey) || storage[storageKey] !== undefined) {
			try {
				this._data[key] = JSON.parse(storage[storageKey]);
			} catch (e) {
				console.error('config parse error key:"%s" value:"%s" ', key, storage[storageKey], e);
			}
		}
		return this._data[key];
	}
	getValue(key) {
		key = this.getNativeKey(key);
		return this._data[key];
	}
	deleteValue(key) {
		key = this.getNativeKey(key);
		const storageKey = this.getStorageKey(key);
		this.storage.removeItem(storageKey);
		this._data[key] = this.default[key];
	}
	setValue(key, value) {
		const _key = key;
		key = this.getNativeKey(key);
		if (this._data[key] === value || value === undefined) {
			return;
		}
		const storageKey = this.getStorageKey(key);
		const storage = this.storage;
		if (!this.readonly) {
			try {
				storage[storageKey] = JSON.stringify(value);
			} catch (e) {
				window.console.error(e);
			}
		}
		this._data[key] = value;
		if (!this.silently) {
			this._changed.set(_key, value);
			this._onChange();
		}
	}
	setValueSilently(key, value) {
		const isSilent = this.silently;
		this.silently = true;
		this.setValue(key, value);
		this.silently = isSilent;
	}
	export(isAll = false) {
		const result = {};
		const _default = this.default;
		Object.keys(this.props)
			.filter(key => isAll || (_default[key] !== this._data[key]))
			.forEach(key => result[key] = this.getValue(key));
		return result;
	}
	exportJson() {
		return JSON.stringify(this.export(), null, 2);
	}
	import(data) {
		Object.keys(this.props)
			.forEach(key => {
				const val = data.hasOwnProperty(key) ? data[key] : this.default[key];
				console.log('import data: %s=%s', key, val);
				this.setValueSilently(key, val);
		});
	}
	importJson(json) {
		this.import(JSON.parse(json));
	}
	getKeys() {
		return Object.keys(this.props);
	}
	clearConfig() {
		this.silently = true;
		const storage = this.storage;
		Object.keys(this.default)
			.filter(key => !this._ignoreExportKeys.includes(key)).forEach(key => {
				const storageKey = this.getStorageKey(key);
				try {
					if (storage.hasOwnProperty(storageKey) || storage[storageKey] !== undefined) {
						console.nicoru('delete storage', storageKey, storage[storageKey]);
						delete storage[storageKey];
					}
					this._data[key] = this.default[key];
				} catch (e) {}
		});
		this.silently = false;
	}
	namespace(name) {
		const namespace = name ? `${name}.` : '';
		const origin = Symbol(`${namespace}`);
		const result = {
			getValue: key => this.getValue(`${namespace}${key}`),
			setValue: (key, value) => this.setValue(`${namespace}${key}`, value),
			on: (key, func) => {
				if (key === 'update') {
					const onUpdate = (key, value) => {
						if (key.startsWith(namespace)) {
							func(key.slice(namespace.length + 1), value);
						}
					};
					onUpdate[origin] = func;
					this.on('update', onUpdate);
					return result;
				}
				return this.onkey(`${namespace}${key}`, func);
			},
			off: (key, func) => {
				if (key === 'update') {
					func = func[origin] || func;
					this.off('update', func);
					return result;
				}
				return this.offkey(`${namespace}${key}`, func);
			},
			onkey: (key, func) => {
				this.on(`update-${namespace}${key}`, func);
				return result;
			},
			offkey: (key, func) => {
				this.off(`update-${namespace}${key}`, func);
				return result;
			},
			props: this.props[name],
			refresh: () => this.refresh(),
			subscribe: subscriber => {
				return this.subscribe(subscriber)
					.filter(changed => changed.keys().some(k => k.startsWith(namespace)))
					.map(changed => {
						const result = new Map;
						for (const k of changed.keys()) {
							k.startsWith(namespace) && result.set(k, changed.get(k));
						}
						return result;
					});
			}
		};
		return result;
	}
	subscribe(subscriber) {
		subscriber = subscriber || this.consoleSubscriber;
		const observable = new Observable(o => {
			const onChange = changed => o.next(changed);
			this.on('change', onChange);
			return () => this.off('change', onChange);
		});
		return observable.subscribe(subscriber);
	}
	watch() {
	}
	unwatch() {
		this.consoleSubscription && this.consoleSubscription.unsubscribe();
		this.consoleSubscription = null;
	}
}

    const config = (() => {
      const DEFAULT_CONFIG = {
        debug: false,

        'videoInfo.openNewWindow': false,
        'mylist.enableAutoComment': true, // マイリストコメントに投稿者を入れる

        'responsive.matrix': false,

        'nicoad.hide': false,

        'ng.enable': false,
        'ng.owner':   '',
        'ng.word':    '',
        'ng.tag':     '',
        'ng.syncZenza': false,

        'fav.owner':   '',
        'fav.word':    '',
        'fav.tag':     ''
      };
      return new DataStorage(
        DEFAULT_CONFIG,
        {
          prefix: `${PRODUCT}_config`,
          ignoreExportKeys: [],
          readonly: !location || location.host !== 'www.nicovideo.jp',
          storage: localStorage
        }
      );
    })();

    MylistPocket.broadcast = (function(config) {
      if (!window.BroadcastChannel) { return; }
      const broadcastChannel = new window.BroadcastChannel(PRODUCT);

      const onBroadcastMessage = (e) => {
        const data = e.data;
        switch (data.type) {
          case 'config-update':
            config.refresh(true);
            break;
        }
      };

      broadcastChannel.addEventListener('message', onBroadcastMessage);

      return {
        postMessage: (...args) => { broadcastChannel.postMessage(...args); }
      };

    })(config);
    config.on('update', (key, value) => {
      if (!config.props.hasOwnProperty(key)) { return; }
      MylistPocket.broadcast.postMessage(
        {type: 'config-update', key, value, storage: 'local'}
      );
    });

    MylistPocket.config = config;



    const CacheStorage = (function() {
      let PREFIX = PRODUCT + '_cache_';

      class CacheStorage {

        constructor(storage, gc = false) {
          this._storage = storage;
          this._memory = {};
          if (gc) { this.gc(); }
          Object.keys(storage).forEach((key) => {
            if (key.indexOf(PREFIX) === 0) {
              this._memory[key] = storage[key];
            }
          });
          this.gc = bounce.time(this.gc.bind(this), 100);
        }

        gc(now = -1) {
          const storage = this._storage;
          now = now >= 0 ? now : Date.now();
          Object.keys(storage).forEach((key, index) => {
            if (key.indexOf(PREFIX) === 0) {
              let item;
              try {
                item = JSON.parse(this._storage[key]);
              } catch(e) {
                storage.removeItem(key);
              }
              //console.info(
              //  `${index}, key: ${key}, expiredAt: ${new Date(item.expiredAt).toLocaleString()}, now: ${new Date(now).toLocaleString()}`);
              if (item.expiredAt === '' || item.expiredAt > now) {
                //console.info('not expired: ', key);
                return;
              }
              //console.info('cache expired: ', key, item.expiredAt);
              storage.removeItem(key);
            }
          });
        }

        setItem(key, data, expireTime) {
          key = PREFIX + key;
          const expiredAt =
            typeof expireTime === 'number' ? (Date.now() + expireTime) : '';

          const cacheData = {
            data: data,
            type: typeof data,
            expiredAt: expiredAt
          };

          this._memory[key] = cacheData;
          try {
            this._storage[key] = JSON.stringify(cacheData);
            this.gc();
          } catch (e) {
            if (e.name === 'QuotaExceededError' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
              this.gc(0);
            }
          }
        }

        getItem(key) {
          key = PREFIX + key;
          if (!(this._storage.hasOwnProperty(key) || this._storage[key] !== undefined)) {
            return null;
          }
          let item = null;
          try {
            item = JSON.parse(this._storage[key]);
          } catch(e) {
            delete this._memory[key];
            this._storage.removeItem(key);
            return null;
          }

          if (item.expiredAt === '' || item.expiredAt > Date.now()) {
            return item.data;
          }
          return null;
        }

        removeItem(key) {
          if (this._memory.hasOwnProperty(key)) {
            delete this._memory[key];
          }
          key = PREFIX + key;
          if (this._storage.hasOwnProperty(key) || this._storage[key] !== undefined) {
            this._storage.removeItem(key);
          }
        }

        clear() {
          const storage = this._storage;
          this._memory = {};
          Object.keys(storage).forEach((v) => {
            if (v.indexOf(PREFIX) === 0) {
              storage.removeItem(v);
            }
          });
        }
      }
      return CacheStorage;
    })();
    MylistPocket.debug.sessionCache = new CacheStorage(sessionStorage, true);
    MylistPocket.debug.localCache   = new CacheStorage(localStorage, true);

    const WindowMessageEmitter = (function() {
      const emitter = new Emitter();
      const knownSource = [];

      const onMessage = (event) => {
        if (_.indexOf(knownSource, event.source) < 0 //&&
            //event.origin !== location.protocol + '//ext.nicovideo.jp'
            ) { return; }

        try {
          let data = JSON.parse(event.data);
          if (data.id !== PRODUCT) { return; }

          emitter.emit('onMessage', data.body, data.type);
        } catch (e) {
          console.log(
            '%cMylistPocket.Error: window.onMessage  - ',
            'color: red; background: yellow',
            e,
            event
          );
          console.log('%corigin: ', 'background: yellow;', event.origin);
          console.log('%cdata: ',   'background: yellow;', event.data);
          console.trace();
        }
      };

      emitter.addKnownSource = (win) => {
        knownSource.push(win);
      };

      window.addEventListener('message', onMessage);

      return emitter;
    })();

class CrossDomainGate extends Emitter {
	static get hostReg() {
		return /^[a-z0-9]*\.nicovideo\.jp$/;
	}
	constructor(...args) {
		super();
		this.initialize(...args);
	}
	initialize(params) {
		this._baseUrl = params.baseUrl;
		this._origin = params.origin || location.href;
		this._type = params.type;
		this._suffix = params.suffix || '';
		this.name = params.name || params.type;
		this._sessions = {};
		this._initializeStatus = 'none';
	}
	_initializeFrame() {
		if (this._initializeStatus !== 'none') {
			return this.promise('initialize');
		}
		this._initializeStatus = 'initializing';
		const append = () => {
			if (!this.loaderFrame.parentNode) {
				console.warn('frame removed');
				this.port = null;
				this._initializeCrossDomainGate();
			}
		};
		setTimeout(append,  5 * 1000);
		setTimeout(append, 10 * 1000);
		setTimeout(append, 20 * 1000);
		setTimeout(append, 30 * 1000);
		setTimeout(() => {
			if (this._initializeStatus === 'done') {
				return;
			}
			this.emitReject('initialize', {
				status: 'timeout', message: `CrossDomainGate初期化タイムアウト (type: ${this._type}, status: ${this._initializeStatus})`
			});
			console.warn(`CrossDomainGate初期化タイムアウト (type: ${this._type}, status: ${this._initializeStatus})`);
		}, 60 * 1000);
		this._initializeCrossDomainGate();
		return this.promise('initialize');
	}
	_initializeCrossDomainGate() {
		window.console.time(`GATE OPEN: ${this.name} ${PRODUCT}`);
		const loaderFrame = this.loaderFrame = document.createElement('iframe');
		loaderFrame.referrerPolicy = 'origin';
		loaderFrame.sandbox = 'allow-scripts allow-same-origin';
		loaderFrame.loading = 'eager';
		loaderFrame.name = `${this._type}${PRODUCT}Loader${this._suffix ? `#${this._suffix}` : ''}`;
		loaderFrame.className = `xDomainLoaderFrame ${this._type}`;
		loaderFrame.style.cssText = `
			position: fixed; left: -100vw; pointer-events: none;user-select: none; contain: strict;`;
		(document.body || document.documentElement).append(loaderFrame);
		this._loaderWindow = loaderFrame.contentWindow;
		const onInitialMessage = event => {
			if (event.source !== this._loaderWindow) {
				return;
			}
			window.removeEventListener('message', onInitialMessage);
			this._onMessage(event);
		};
		window.addEventListener('message', onInitialMessage, {capture: true});
		this._loaderWindow.location.replace(this._baseUrl + '#' + TOKEN);
	}
	_onMessage(event) {
		const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
		const {id, type, token, sessionId, body} = data;
		if (id !== PRODUCT || type !== this._type || token !== TOKEN) {
			console.warn('invalid token:',
				{id, PRODUCT, type, _type: this._type, token, TOKEN});
			return;
		}
		if (!this.port && body.command === 'initialized') {
			const port = this.port = event.ports[0];
			port.addEventListener('message', this._onMessage.bind(this));
			port.start();
			port.postMessage({body: {command: 'ok'}, token: TOKEN});
		}
		return this._onCommand(body, sessionId);
	}
	_onCommand({command, status, params}, sessionId = null) {
		switch (command) {
			case 'initialized':
				if (this._initializeStatus !== 'done') {
					this._initializeStatus = 'done';
					const originalBody = params;
					window.console.timeEnd(`GATE OPEN: ${this.name} ${PRODUCT}`);
					const result = this._onCommand(originalBody, sessionId);
					this.emitResolve('initialize', {status: 'ok'});
					return result;
				}
				break;
			case 'message':
				BroadcastEmitter.emitAsync('message', params, 'broadcast', sessionId);
				break;
			default: {
				const session = this._sessions[sessionId];
				if (!session) {
					return;
				}
				if (status === 'ok') {
					session.resolve(params);
				} else {
					session.reject({message: status || 'fail'});
				}
				delete this._sessions[sessionId];
			}
				break;
		}
	}
	load(url, options) {
		return this._postMessage({command: 'loadUrl', params: {url, options}});
	}
	videoCapture(src, sec) {
		return this._postMessage({command: 'videoCapture', params: {src, sec}})
			.then(result => Promise.resolve(result.dataUrl));
	}
	_fetch(url, options) {
		return this._postMessage({command: 'fetch', params: {url, options}});
	}
	async fetch(url, options = {}) {
		const result = await this._fetch(url, options);
		if (typeof result === 'string' || !result.buffer || !result.init || !result.headers) {
			return result;
		}
		const {buffer, init, headers} = result;
		const _headers = new Headers();
		(headers || []).forEach(a => _headers.append(...a));
		const _init = {
			status: init.status,
			statusText: init.statusText || '',
			headers: _headers
		};
		if (options._format === 'arraybuffer') {
			return {buffer, init, headers};
		}
		return new Response(buffer, _init);
	}
	async configBridge(config) {
		const keys = config.getKeys();
		this._config = config;
		const configData = await this._postMessage({
			command: 'dumpConfig',
			params: { keys, url: '', prefix: PRODUCT }
		});
		for (const key of Object.keys(configData)) {
			config.props[key] = configData[key];
		}
		if (!this.constructor.hostReg.test(location.host) &&
			!config.props.allowOtherDomain) {
			return;
		}
		config.on('update', (key, value) => {
			if (key === 'autoCloseFullScreen') {
				return;
			}
			this._postMessage({command: 'saveConfig', params: {key, value, prefix: PRODUCT}}, false);
		});
	}
	async _postMessage(body, usePromise = true, sessionId = '') {
		await this._initializeFrame();
		sessionId = sessionId || (`gate:${Math.random()}`);
		const {params} = body;
		return this._sessions[sessionId] =
			new PromiseHandler((resolve, reject) => {
				try {
					this.port.postMessage({body, sessionId, token: TOKEN}, params.transfer);
					if (!usePromise) {
						delete this._sessions[sessionId];
						resolve();
					}
				} catch (error) {
					console.log('%cException!', 'background: red;', {error, body});
					delete this._sessions[sessionId];
					reject(error);
				}
		});
	}
	postMessage(body, promise = true) {
		return this._postMessage(body, promise);
	}
	sendMessage(body, usePromise = false, sessionId = '') {
		return this._postMessage({command: 'message', params: body}, usePromise, sessionId);
	}
	pushHistory(path, title) {
		return this._postMessage({command: 'pushHistory', params: {path, title}}, false);
	}
	async bridgeDb({name, ver, stores}) {
		const worker = await this._postMessage(
			{command: 'bridge-db', params: {command: 'open', params: {name, ver, stores}}}
		);
		const post = (command, data, storeName, transfer) => {
			const params = {data, storeName, transfer, name};
			return this._postMessage({command: 'bridge-db', params: {command, params, transfer}});
		};
		const result = {worker};
		for (const meta of stores) {
			const storeName = meta.name;
			result[storeName] = (storeName => {
				return {
					close: params => post('close', params, storeName),
					put: (record, transfer) => post('put', record, storeName, transfer),
					get: ({key, index, timeout}) => post('get', {key, index, timeout}, storeName),
					updateTime: ({key, index, timeout}) => post('updateTime', {key, index, timeout}, storeName),
					delete: ({key, index, timeout}) => post('delete', {key, index, timeout}, storeName),
					gc: (expireTime = 30 * 24 * 60 * 60 * 1000, index = 'updatedAt') => post('gc', {expireTime, index}, storeName)
				};
			})(storeName);
		}
		return result;
	}
}

    const CsrfTokenLoader = (() => {
      const cacheStorage = new CacheStorage(
        location.host === 'www.nicovideo.jp' ? localStorage : sessionStorage);
      const TIMEOUT = 10 * 1000;
      const CACHE_EXPIRE_TIME = 60 * 30 * 1000;

      class CsrfTokenLoader {
        static load() {
          return new Promise((resolve, reject) => {
            const cache = cacheStorage.getItem('csrfToken');
            if (cacheStorage.getItem('csrfToken')) {
              return resolve(cache);
            }

            let timeoutTimer = window.setTimeout(() => {
              reject('timeout');
            }, TIMEOUT);

            return CsrfTokenLoader._getToken().then((token) => {
              window.clearTimeout(timeoutTimer);
              CsrfTokenLoader.saveToCache(token);
              resolve(token);
            });
          });
        }

        static saveToCache(token) {
          cacheStorage.setItem('csrfToken', token, CACHE_EXPIRE_TIME);
        }

        static _getToken() {
          const url = 'https://www.nicovideo.jp/mylist_add/video/sm9';
          const tokenReg = /NicoAPI\.token *= *["']([a-z0-9-]+)["'];/;
          let m;
          return fetch(url, { credentials: 'include', _format: 'text'})
            .then(res => res.text())
            .then(result => {
            if ((m = tokenReg.exec(result))) {
              const token = m[1];
              return Promise.resolve(token);
            } else {
              return Promise.reject('token parse error');
            }
          });
        }
      }

      util.emitter.on('csrfToken', (token) => {
        CsrfTokenLoader.saveToCache(token);
      });

      return CsrfTokenLoader;
    })();

    MylistPocket.debug.CsrfTokenLoader = CsrfTokenLoader;

    const ThumbInfoLoader = (() => {
      const BASE_URL = 'https://ext.nicovideo.jp/';
      const MESSAGE_ORIGIN = 'https://ext.nicovideo.jp/';
      const CACHE_EXPIRE_TIME = 60 * 60 * 1000;
      //const CACHE_EXPIRE_TIME = 60 * 1000;
      let gate = null;
      let cacheStorage = new CacheStorage(sessionStorage, true);
      let failedResult = {};

      class ThumbInfoLoader {

        constructor() {
          this._emitter = new Emitter();

          gate = new CrossDomainGate({
            baseUrl: BASE_URL,
            origin: MESSAGE_ORIGIN,
            type: 'thumbInfo',
            messager: WindowMessageEmitter
          });
        }

        _onMessage(data, type) {
          if (type !== 'videoInfoLoader') { return; }
          const info = data.message;

          this.emit('load', info, 'THUMB_WATCH');
        }

        _parseXml(xmlText) {
          return parseThumbInfo(xmlText);
        }

        async load(watchId, options = {}) {
          const cacheKey = `thumbInfo_${watchId}`;
          const cache = cacheStorage.getItem(cacheKey);

          if (failedResult[`${watchId}`]) {
            return Promise.reject({data: failedResult[`${watchId}`], watchId});
          }
          if (cache) {
            return cache;
          }

          const thumbInfo =
            await gate.fetch(`${BASE_URL}api/getthumbinfo/${watchId}`, options)
              .catch(e => { return {status: 'fail', message: e.message || `gate.fetch('${watchId}') failed` }; });
          thumbInfo.fromCache = !!cache;
          if (thumbInfo.status !== 'ok') {
            failedResult[`${watchId}`] = thumbInfo;
            return Promise.reject(thumbInfo);
          }
          cacheStorage.setItem(cacheKey, thumbInfo, CACHE_EXPIRE_TIME);
          return thumbInfo;
        }
      }

      const loader = new ThumbInfoLoader();
      return {
        load: watchId => loader.load(watchId),
        loadOwnerInfo: async watchId => {
          const info = await loader.load(watchId);
          const owner = info.owner;
          if (!owner) {
            return {};
          }

          const lang = util.getPageLanguage();
          const prefix = owner.type === 'user' ? '投稿者: ' : '提供: ';
          const suffix =
            (owner.type === 'user' && lang.startsWith('ja')) ? ' さん' : '';
          owner.linkId =
            owner.id ?
              (owner.type === 'user' ? `user/${owner.id}` : `ch${owner.id}`) :
              '';
          owner.localeName = `${prefix}${owner.name}${suffix}`;
          return owner;
        }
      };

    })();

    MylistPocket.debug.ThumbInfoLoader = ThumbInfoLoader;

const emitter = util.emitter;
const MylistApiLoader = (() => {
	const CACHE_EXPIRE_TIME = 5 * 60 * 1000;
	const TOKEN_EXPIRE_TIME = 59 * 60 * 1000;
	let cacheStorage = null;
	let token = '';
	if (window.ZenzaWatch) {
		emitter.on('csrfTokenUpdate', t => {
			token = t;
			if (cacheStorage) {
				cacheStorage.setItem('csrfToken', token, TOKEN_EXPIRE_TIME);
			}
		});
	}
	class MylistApiLoader {
		constructor() {
			if (!cacheStorage) {
				cacheStorage = new CacheStorage(sessionStorage);
			}
			if (!token) {
				token = cacheStorage.getItem('csrfToken');
				if (token) {
					console.log('cached token exists', token);
				}
			}
		}
		setCsrfToken(t) {
			token = t;
			if (cacheStorage) {
				cacheStorage.setItem('csrfToken', token, TOKEN_EXPIRE_TIME);
			}else{
				cacheStorage = new CacheStorage(sessionStorage);
				cacheStorage.setItem('csrfToken', token, TOKEN_EXPIRE_TIME);
			}
		}
		async _getCsrfToken(){
				if (!cacheStorage) {
						cacheStorage = new CacheStorage(sessionStorage);
				}
				token = cacheStorage.getItem('csrfToken');
				if (token) {
						console.log('cached token exists', token);
				}else{
						const tokenUrl = 'https://www.nicovideo.jp/my/mylist';
						const result = await netUtil.fetch( tokenUrl, {
						cledentials: 'include'
						}).then(r => r.text()).catch(result => {
								throw new Error('マイリストトークン取得失敗', {result, status: 'fail'});
						});
						const dom = new DOMParser().parseFromString(result, 'text/html');
						const initUserpageDataContena = dom.querySelector('#js-initial-userpage-data');
						const env = JSON.parse(initUserpageDataContena.getAttribute('data-environment'));
						this.setCsrfToken(env.csrfToken); 
				}
				return token;
		}
		async _getDeflistItems(frontendId = 6, frontendVersion = 0) {
			const url = 'https://nvapi.nicovideo.jp/v1/users/me/watch-later?sortKey=addedAt&sortOrder=desc';
			const page = new URLSearchParams({ pageSize: 100, page: 1 });
			let data;
			do {
				const res = await netUtil.fetch(`${url}&${page.toString()}`, {
					headers: {'X-Frontend-Id': frontendId, 'X-Frontend-Version': frontendVersion},
					credentials: 'include'
				}).then(r => r.json())
					.catch(e => { throw new Error('とりあえずマイリストの取得失敗(2)', e); });
				if (res.meta.status !== 200 || !res.data.watchLater) {
					throw new Error('とりあえずマイリストの取得失敗(1)', res);
				}
				if (data == null) {
					data = res.data.watchLater;
				} else {
					data.hasInvisibleItems = data.hasInvisibleItems || res.data.watchLater.hasInvisibleItems;
					data.hasNext = res.data.watchLater.hasNext;
					data.items.concat(res.data.watchLater.items);
				}
				page.set('page', parseInt(page.get('page')) + 1);
			} while (data && data.hasNext);
			return data.items;
		}
		async _getMylistItems(id, frontendId = 6, frontendVersion = 0) {
			const url = `https://nvapi.nicovideo.jp/v1/users/me/mylists/${id}`;
			const page = new URLSearchParams({ pageSize: 100, page: 1 });
			let data;
			do {
				const res = await netUtil.fetch(`${url}?${page.toString()}`, {
					headers: {'X-Frontend-Id': frontendId, 'X-Frontend-Version': frontendVersion},
					credentials: 'include'
				}).then(r => r.json())
					.catch(e => { throw new Error('マイリスト取得失敗(2)', e); });
				if (res.meta.status !== 200 || !res.data.mylist) {
					throw new Error('マイリスト取得失敗(1)', res);
				}
				if (data == null) {
					data = res.data.mylist;
				} else {
					data.hasInvisibleItems = data.hasInvisibleItems || res.data.mylist.hasInvisibleItems;
					data.hasNext = res.data.mylist.hasNext;
					data.items.concat(res.data.mylist.items);
				}
				page.set('page', parseInt(page.get('page')) + 1);
			} while (data && data.hasNext);
			return data.items;
		}
		async getMylistList({ frontendId = 6, frontendVersion = 0 } = {}) {
			const url = 'https://nvapi.nicovideo.jp/v1/users/me/mylists';
			const cacheKey = 'mylistList';
			const cacheData = cacheStorage.getItem(cacheKey);
			if (cacheData) {
				return cacheData;
			}
			const result = await netUtil.fetch(url, {
				headers: {'X-Frontend-Id': frontendId, 'X-Frontend-Version': frontendVersion},
				credentials: 'include'
			}).then(r => r.json())
				.catch(e => { throw new Error('マイリスト一覧の取得失敗(2)', e); });
			if (result.meta.status !== 200 || !result.data.mylists) {
				throw new Error(`マイリスト一覧の取得失敗(1) ${result.status}${result.message}`, result);
			}
			const data = result.data.mylists;
			cacheStorage.setItem(cacheKey, data, CACHE_EXPIRE_TIME);
			return data;
		}
		async findDeflistItemByWatchId(watchId) {
			const items = await this._getDeflistItems().catch(() => []);
			for (let item of items) {
				if (item.watchId === watchId) {
					return item;
				}
			}
			return Promise.reject();
		}
		async findMylistItemByWatchId(watchId, groupId) {
			const items = await this._getMylistItems(groupId).catch(() => []);
			for (let item of items) {
				if (item.watchId === watchId) {
					return item;
				}
			}
			return Promise.reject();
		}
		async removeDeflistItem(watchId, { frontendId = 6, frontendVersion = 0 } = {}) {
			const item = await this.findDeflistItemByWatchId(watchId).catch(result => {
				throw new Error('動画が見つかりません', {result, status: 'fail'});
			});
			const body = `itemIds=${item.itemId}`;
			const url = 'https://nvapi.nicovideo.jp/v1/users/me/watch-later?' + body;
			const cacheKey = 'deflistItems';
			const result = await netUtil.fetch(url, {
				method: 'DELETE',
				headers: {
					'X-Frontend-Id': frontendId,
					'X-Frontend-Version': frontendVersion,
					'X-Request-With': 'https://www.nicovideo.jp'
				},
				credentials: 'include'
			}).then(r => r.json())
				.catch(result => {
					throw new Error('とりあえずマイリストから削除失敗(2)', { result, status: 'fail' });
				});
			if (result.meta.status && result.meta.status === 200) {
				cacheStorage.removeItem(cacheKey);
				emitter.emitAsync('deflistRemove', watchId);
				return {
					status: 'ok',
					result,
					message: 'とりあえずマイリストから削除'
				};
			}
			throw new Error(result.error.description, {
					status: 'fail', result, code: result.error.code
			});
		}
		async removeMylistItem(watchId, groupId, { frontendId = 6, frontendVersion = 0 } = {}) {
			const item = await this.findMylistItemByWatchId(watchId, groupId).catch(result => {
					throw new Error('動画が見つかりません', {result, status: 'fail'});
				});
			let body = 'itemIds=' + watchId;
			const url = 'https://nvapi.nicovideo.jp/v1/users/me/mylists/' + groupId + '/items?' + body;
			const cacheKey = `mylistItems: ${groupId}`;
			const result = await netUtil.fetch(url, {
				method: 'DELETE',
				headers: {
					'X-Frontend-Id': frontendId,
					'X-Frontend-Version': frontendVersion,
					'X-Request-With': 'https://www.nicovideo.jp'
				},
				credentials: 'include'
			}).then(r => r.json())
				.catch(result => {
					throw new Error('マイリストから削除失敗(2)', {result, status: 'fail'});
				});
			if (result.meta.status && result.meta.status === 200) {
				cacheStorage.removeItem(cacheKey);
				emitter.emitAsync('mylistRemove', watchId, groupId);
				return {
					status: 'ok',
					result,
					message: 'マイリストから削除'
				};
			}
			throw new Error(result.error.description, {
				status: 'fail',
				result,
				code: result.error.code
			});
		}
		async addDeflistItem(watchId, description, isRetry = false, { frontendId = 6, frontendVersion = 0 } = {}) {
			let url = 'https://nvapi.nicovideo.jp/v1/users/me/watch-later';
			let body = `watchId=${watchId}&memo=`;
			if (description) {
				body += `${encodeURIComponent(description)}`;
			}
			let cacheKey = 'deflistItems';
			const result = await netUtil.fetch(url, {
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Frontend-Id': frontendId, 'X-Frontend-Version': frontendVersion, 'X-Request-With': 'https://www.nicovideo.jp' },
				credentials: 'include'
			}).then(r => r.json())
				.catch(err => {
						throw new Error('とりあえずマイリスト登録失敗(200)', {
							status: 'fail',
							result: err
						});
					});
			if (result.meta.status && ( result.meta.status === 200 || result.meta.status === 201 )) {
				cacheStorage.removeItem(cacheKey);
				emitter.emitAsync('deflistAdd', watchId, description);
				return {
					status: 'ok',
					result,
					message: 'とりあえずマイリスト登録'
				};
			}
			if (result.meta.status && result.meta.status === 409 && !isRetry) {
					await this.removeDeflistItem(watchId).catch(err => {
							throw new Error('とりあえずマイリスト登録失敗(101)', {
								status: 'fail',
								result: err.result,
								code: err.code
							});
						});
					const added = await this.addDeflistItem(watchId, description, true, {frontendId, frontendVersion});
					return {
						status: 'ok',
						result: added,
						message: 'とりあえずマイリストの先頭に移動'
					};
			}
			if (!result.meta.status || !result.error) { // result.errorが残っているかは不明
				throw new Error('とりあえずマイリスト登録失敗(100)', {
					status: 'fail',
					result,
				});
			}
				throw new Error(result.error.description, {
					status: 'fail',
					result,
					code: result.error.code,
					message: result.error.description
				});
		}
		async addMylistItem(watchId, groupId, description, { frontendId = 6, frontendVersion = 0 } = {}) {
			let body = 'itemId=' + watchId + '&description=';//+ '&token=' + token + '&group_id=' + groupId;
			if (description) {
				body += encodeURIComponent(description);
			}
			const url = 'https://nvapi.nicovideo.jp/v1/users/me/mylists/' + groupId + '/items?' + body ;
			const cacheKey = `mylistItems: ${groupId}`;
			const result = await netUtil.fetch(url, {
				method: 'POST',
				body,
				headers: {  'Content-Type': 'application/x-www-form-urlencoded', 'X-Frontend-Id': frontendId, 'X-Frontend-Version': frontendVersion, 'X-Request-With': 'https://www.nicovideo.jp'},
				credentials: 'include'
			}).then(r => r.json())
				.catch(err => {
					throw new Error('マイリスト登録失敗(200)', {
						status: 'fail',
						result: err
					});
				});
			if (result.meta.status && ( result.meta.status === 200 || result.meta.status === 201 )) {
				cacheStorage.removeItem(cacheKey);
				this.removeDeflistItem(watchId).catch(() => {});
				return {status: 'ok', result, message: 'マイリスト登録'};
			}
			if (!result.meta.status /*|| !result.error*/) {
				throw new Error('マイリスト登録失敗(100)', {status: 'fail', result});
			}
			emitter.emitAsync('mylistAdd', watchId, groupId, description);
			throw new Error(result.error.description, {
					status: 'fail', result, code: result.error.code
			});
		}
	}
	return new MylistApiLoader();
})();


    class HoverMenu extends Emitter {
      constructor() {
        super();
        this._init();
      }

      _init() {
        this._view = document.querySelector('.mylistPocketHoverMenu');

        this._view.addEventListener(location.host.includes('google') ? 'mouseup' : 'click', this._onClick.bind(this));
        this._view.addEventListener('mousedown', this._onMousedown.bind(this));
        this._view.addEventListener('contextmenu', this._onContextMenu.bind(this));

        this._onHoverEnd = bounce.time(this._onHoverEnd.bind(this), 500);
        document.body.addEventListener(
          'mouseover', this._onHover.bind(this), {passive: true});
        document.body.addEventListener(
          'mouseout',  this._onMouseout.bind(this), {passive: true});
        document.body.addEventListener(
          'mouseover', this._onHoverEnd, {passive: true});
        document.body.addEventListener(
          'click', () => { this.hide(); }, {passive: true});


        util.emitter.on('hideHover', () => this.hide());

        this._x = this._y = 0;

        ZenzaDetector.detect().then(ZenzaWatch => {
          this._isZenzaReady = true;
          this.addClass('is-zenzaReady');
          ZenzaWatch.emitter.on('DialogPlayerOpen', bounce.time(() => {
            this.hide();
          }, 1000));
        });

        this.toggleClass('is-otherDomain', location.host !== 'www.nicovideo.jp');
        this.toggleClass('is-guest', !util.isLogin());
        this._deflistButton = this._view.querySelector('.mylistPocketButton.deflist-add');
        MylistPocket.debug.hoverMenu = this._view;
      }

      toggleClass(className, v) {
        className.split(/ +/).forEach((c) => {
          this._view.classList.toggle(c, v);
        });
      }

      addClass(className)    { this.toggleClass(className, true); }
      removeClass(className) { this.toggleClass(className, false); }

      hide() {
        this.removeClass('is-show');
      }

      show() {
        this.addClass('is-show');
      }

      moveTo(x, y) {
        this._x = x;
        this._y = y;
        this._view.style.left = x + 'px';
        this._view.style.top  = y + 'px';
      }

      _onClick(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      _onContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      _onMousedown(e) {
        const watchId = this._watchId;
        const target = e.target.classList.contains('command') ?
          e.target : e.target.closest('.command');
        const command = target.getAttribute('data-command');
        e.preventDefault();
        e.stopPropagation();

        if (command === 'info') {
          this._videoInfo(watchId);
          this.hide();
        } else if (command === 'playlist-queue') {
          this.emit('playlist-queue', watchId, this);
        } else {
          if (e.button !== 0 || e.shiftKey) {
            this._deflistRemove(watchId);
          } else {
            this._deflist(watchId);
          }
        }
      }

      _videoInfo(watchId) {
        this.emit('info', watchId || this._watchId, this);
      }

      _deflist(watchId) {
        this.emit('deflist-add', watchId || this._watchId, this);
      }

      _deflistRemove(watchId) {
        this.emit('deflist-remove', watchId || this._watchId, this);
      }

      _onHover(e) {
        const target = this._isTargetElement(e);
        if (!target) { return; }

        this._hoverElement = target;
      }

      _onHoverEnd(e) {
        const target =
          e.target.tagName === 'A' ? e.target : e.target.closest('a');
        if (!target || this._hoverElement !== target) { return; }
        const href = target.getAttribute('data-href') || target.getAttribute('href');
        const watchId = target.dataset.nicoVideoId || util.getWatchId(href);
        const offset = target.getBoundingClientRect();
        //const bodyOffset = document.body.getBoundingClientRect();
        const scrollTop  = document.documentElement.scrollTop  || document.body.scrollTop  || 0;
        const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        const left = offset.left + scrollLeft;
        const top  = offset.top  + scrollTop;
        const host = target.hostname;
        if (host !== 'www.nicovideo.jp' && host !== 'nico.ms' && host !== 'sp.nicovideo.jp') { return; }

        if (target.classList.contains('noHoverMenu')) { return; }
        if (!watchId || !watchId.match(/^[a-z0-9]+$/)) { return; }
        if (watchId.indexOf('lv') === 0) { return; }

        this._watchId = watchId;
        this.show();
        this.moveTo(
          left + target.offsetWidth  - this._view.offsetWidth / 2,
          top  + target.offsetHeight / 2 - this._view.offsetHeight / 2
        );
      }

      _onMouseout(e) {
        const target = this._isTargetElement(e);
        if (!target) { return; }

        if (this._hoverElement === e.target) {
          this._hoverElement = null;
        }
      }

      _isTargetElement(e) {
        const target =
          e.target.tagName === 'A' ? e.target : e.target.closest('a');
        if (!target) { return false; }
        const href = target.href || '';
        if (!/(watch\/[a-z0-9]+|nico\.ms\/[a-z0-9]+)/.test(href)) { return false; }
        return target;
      }

      set isBusy(v) {
        this._isBusy = v;
        this.toggleClass('is-busy', v);
      }

      get isBusy() {
        return !!this._isBusy;
      }

      notifyBeginDeflistUpdate(/*watchId*/) {
        this.addClass('is-deflistUpdating');
      }

      notifyEndDeflistUpdate(result) {
        this.addClass('is-deflistSuccess');
        window.setTimeout(() => { this.removeClass('is-deflistSuccess'); }, 3000);

        this._deflistButton.setAttribute('data-result', result.message || '登録しました');
        this.removeClass('is-deflistUpdating');
      }

      notifyFailDeflistUpdate(result) {
        this.addClass('is-deflistFail');
        window.setTimeout(() => { this.removeClass('is-deflistFail'); }, 3000);

        this._deflistButton.setAttribute('data-result', result.message || '登録失敗');
        this.removeClass('is-deflistUpdating');
      }
    }


    class VideoInfoView extends Emitter {
      constructor({host, tpl}) {
        super();
        this._host = host;
        this._tpl = tpl;
        this._slot = {};

        this._baseConfig = config;
        this._config    = config.namespace('videoInfo');
        this._mylistConfig = config.namespace('mylist');
        const ngConfig  = this._ngConfig  = config.namespace('ng');
        const favConfig = this._favConfig = config.namespace('fav');
        this._nicoadConfig = config.namespace('nicoad');

        const {ngChecker, favChecker} = initNgChecker({ngConfig, favConfig});
        this._ngChecker  = ngChecker;
        this._favChecker = favChecker;
      }

      _initialize() {
        if (this._isInitialized) { return; }
        const host = this._host;
        const tpl = this._tpl;

        this._shadowRoot = util.attachShadowDom({host, tpl});
        Array.prototype.forEach.call(this._host.querySelectorAll('*'), (elm) => {
          //this._host.querySelectorAll('*').forEach((elm) => {
          const slot = elm.getAttribute('slot');
          if (!slot) { return; }
          //const type = elm.getAttribute('data-type') || 'string';
          this._slot[slot] = elm;
        });

        this._rootDom = this._shadowRoot.querySelector('.root');
        this._hostDom = this._host;

        this._rootDom.addEventListener('mousedown', e => { e.stopPropagation(); });
        this._shadowRoot.addEventListener('mousedown', e => { e.stopPropagation(); });
        this._rootDom.querySelector('.setting-panel-main').addEventListener('click', e => {
          e.stopPropagation();
        });

        this._initSettingPanel();

        const updateNgEnable = v => { this.toggleClass('is-ng-enable', v); };
        updateNgEnable(this._ngConfig.props.enable);
        this._ngConfig.onkey('enable', updateNgEnable);

        this._rootDom.addEventListener('click', this._onClick.bind(this));

        this._boundOnBodyMouseDown = this._onBodyMouseDown.bind(this);

        MylistPocket.debug.view = this;

        util.emitter.on('hideHover', () => {
          this.hide();
        });

        const debUpdateFavNg = bounce.time(this._updateFavNg.bind(this), 100);
        this._ngConfig    .on('update', debUpdateFavNg);
        this._favConfig   .on('update', debUpdateFavNg);
        //this._mylistConfig.on('update', debUpdateFavNg);

        ZenzaDetector.detect().then(() => {
          this._isZenzaReady = true;
          this.addClass('is-zenzaReady');
          window.ZenzaWatch.emitter.on('DialogPlayerOpen', bounce.time(() => {
            this.hide();
          }, 1000));
        });

        this._videoInfoArea = this._rootDom.querySelector('.video-info');
        this._deflistButton =
          this._rootDom.querySelector('.mylistPocketButton.deflist-add');

        this.toggleClass('is-otherDomain', location.host !== 'www.nicovideo.jp');
        this.toggleClass('is-firefox', util.isFirefox());

        MylistPocket.external.observe({
          query: 'a.videoLink',
          container: this._hostDom.querySelector('.description'),
        });

        this._isInitialized = true;
      }

      _initSettingPanel() {
        const onSettingFormChange = this._onSettingFormChange.bind(this);

        const refresh = () => {
          Array.from(this._rootDom.querySelectorAll('.setting-form')).forEach(elm => {
            const name = elm.getAttribute('data-config-name');
            if (!name) { return; }
            const namespace = elm.getAttribute('data-config-namespace') || '';
            let config = this._config;
            switch (namespace) {
              case 'ng':
                config = this._ngConfig;
                break;
              case 'fav':
                config = this._favConfig;
                break;
              case 'mylist':
                config = this._mylistConfig;
                break;
              case 'nicoad':
                config = this._nicoadConfig;
                break;
              default:
                config = this._baseConfig;
            }
            const tagName = (elm.tagName.toLowerCase()).toLowerCase();
            if (tagName === 'input') {
              const type = (elm.type || '').toLowerCase();
              switch (type) {
                case 'checkbox':
                  elm.checked = !!config.props[name];
                  break;
                default:
                  elm.value   = config.props[name];
                  break;
              }
            } else if (tagName === 'select' || tagName === 'textarea') {
              elm.value = config.props[name];
            }

            elm.removeEventListener('change', onSettingFormChange);
            elm.addEventListener('change', onSettingFormChange);
          });
        };

        const onUpdate = bounce.time(refresh, 100);

        const syncZenza = bounce.time(() => {
          if (!this._ngConfig.props.syncZenza || !this._isZenzaReady) { return; }
          window.ZenzaWatch.config.setValue('videoTagFilter', this._ngConfig.props.tag);
          window.ZenzaWatch.config.setValue('videoOwnerFilter', this._ngConfig.props.owner);
        }, 1000);

        refresh();

        this._config.on('update',  onUpdate);
        this._favConfig.on('update', onUpdate);
        this._ngConfig.on('update', () => {
          onUpdate();
          syncZenza();
        });

      }

      _onSettingFormChange(e) {
        const elm = e.target;
        const name = elm.getAttribute('data-config-name');
        if (!name) { return; }
        const namespace = elm.getAttribute('data-config-namespace') || '';
        let config = this._config;
        switch (namespace) {
          case 'ng':
            config = this._ngConfig;
            break;
          case 'fav':
            config = this._favConfig;
            break;
          case 'mylist':
            config = this._mylistConfig;
            break;
          case 'nicoad':
            config = this._nicoadConfig;
            break;
          default:
            config = this._baseConfig;
        }

        const tagName = (elm.tagName.toLowerCase()).toLowerCase();
        if (tagName === 'input') {
          const type = (elm.type || '').toLowerCase();
          switch (type) {
            case 'checkbox':
              config.props[name] = elm.checked;
              break;
            default:
              config.props[name] = elm.value;
              break;
          }
        } else if (tagName === 'select' || tagName === 'textarea') {
          config.props[name] = elm.value;
        }
      }

      toggleClass(className, v) {
        className.split(/ +/).forEach((c) => {
          this._rootDom.classList.toggle(c, v);
          this._hostDom.classList.toggle(c, v);
        });
      }

      addClass(className)    { this.toggleClass(className, true); }
      removeClass(className) { this.toggleClass(className, false); }

      bind(videoInfo) {
        this._videoInfo = videoInfo;
        if (videoInfo.status === 'ok') {
          this._bindSuccess(videoInfo);
        } else {
          this._bindFail(videoInfo);
        }
        window.setTimeout(() => {
          this.removeClass('is-loading');
        }, 0);
      }

      _onClick(e) {
        const t = e.target;
        const elm =
          t.classList.contains('command') ?
            t : e.target.closest('.command');
        if (!elm) { return; }

        // 簡易 throttle
        if (elm.classList.contains('is-active')) { return; }
        elm.classList.add('is-active');
        window.setTimeout(() => { elm.classList.remove('is-active'); }, 500);

        e.preventDefault();
        e.stopPropagation();
        const command = elm.getAttribute('data-command');
        const param   = elm.getAttribute('data-param');
        switch (command) {
          case 'toggle-setting':
            this.toggleSettingPanel();
            break;
          case 'add-ng-tag':    case 'add-fav-tag':
          case 'toggle-ng-tag': case 'toggle-fav-tag': {
              const tag = elm.getAttribute('data-tag') || '';
              if (!tag) { break; }
              this.emit('command', command, {
                watchId: this._videoInfo.watchId,
                value: tag
              }, this);
            }
            break;
          case 'add-ng-owner':    case 'add-fav-owner':
          case 'toggle-ng-owner': case 'toggle-fav-owner': {
              let owner =
                (this._videoInfo.isChannel ? 'ch' : '') +
                 this._videoInfo.ownerId + '#' + this._videoInfo.ownerName;
              this.emit('command', command, {
                watchId: this._videoInfo.watchId,
                value: owner
              }, this);
            }
            break;
          case 'mylist-comment-open':
            this.emit('command', command, this._videoInfo.watchId);
            break;
          case 'close':
            this.hide();
            break;
           default:
            this.emit('command', command, param, this);
        }
      }

      _updateFavNg() {
        if (!this._isInitialized) { return; }
        if (!this._videoInfo  || this._videoInfo.status !== 'ok') { return; }

        const videoInfo = this._videoInfo;
        const ownerInfo = this._rootDom.querySelector('.owner-info');
        ownerInfo.classList.toggle('is-favorited',
          this._favChecker.isMatchOwner(videoInfo.owner));
        ownerInfo.classList.toggle('is-ng',
          this._ngChecker .isMatchOwner(videoInfo.owner));

        Array.prototype.forEach.call(
          this._rootDom.querySelectorAll('.tag-container'),
          (elm) => {
            const tag = elm.getAttribute('data-tag');
            elm.classList.toggle('is-favorited', this._favChecker.isMatchTag(tag));
            elm.classList.toggle('is-ng',        this._ngChecker.isMatchTag(tag));
          });
      }

      toggleSettingPanel() {
        this.toggleClass('is-setting');
      }

      _onBodyMouseDown() {
        document.body.removeEventListener('mousedown', this._boundOnBodyMouseDown);
        this.hide();
      }

      reset() {
        this._initialize();
        window.setTimeout(() => { this._videoInfoArea.scrollTop = 0; }, 0);
        this.removeClass('noclip');
        this.addClass('is-loading');
      }

      show() {
        this.addClass('show');
        document.body.addEventListener('mousedown', this._boundOnBodyMouseDown);
      }

      hide() {
        this._videoInfoArea.scrollTop = 0;
        this.removeClass('show is-ok is-fail noclip is-setting');
      }

      _bindSuccess(videoInfo) {
        const toCamel = p => {
          return p.replace(/-./g, s => { return s.charAt(1).toUpperCase(); });
        };

        Object.keys(this._slot).forEach((key) => {
          const camelKey = toCamel(key);
          const data = videoInfo[camelKey];

          const elm = this._slot[key];
          const type = elm.getAttribute('data-type') || 'string';
          switch (type) {
            case 'html':
              this._createDescription(elm, data);
              break;
            case 'int': {
              let i = parseInt(data, 10);
              i = i.toLocaleString ? i.toLocaleString() : i;
              elm.textContent = i;
            }
              break;
            case 'link':
              elm.href = data;
              break;
            case 'image':
              elm.src = data.replace('http:', 'https:');
              break;
            case 'date':
              elm.textContent = data.toLocaleString();
              break;
            default:
              elm.textContent = data;
          }
        });

        const df = document.createDocumentFragment();
        //Array.prototype.forEach.call(this._host.querySelectorAll('.tag'), t => { t.remove(); });
        videoInfo.tags.forEach(tag => {
          df.appendChild((this._createTagSlot(tag, videoInfo)));
        });
        const videoTags = this._rootDom.querySelector('.video-tags');
        videoTags.innerHTML = '';
        videoTags.appendChild(df);

        Array.prototype.forEach.call(this._rootDom.querySelectorAll('.command-watch-id'), elm => {
          elm.setAttribute('data-param', videoInfo.watchId);
        });
        Array.prototype.forEach.call(this._rootDom.querySelectorAll('.command-video-id'), elm => {
          elm.setAttribute('data-param', videoInfo.videoId);
        });

        const target = this._config.props.openNewWindow ? '_blank' : '_self';
        Array.prototype.forEach.call(
          this._host.querySelectorAll('.target-change'), elm => {
          elm.target = target;
          elm.rel = 'noopener';
        });

        this._updateFavNg();

        this.toggleClass('is-channel', videoInfo.isChannel);
        this.addClass('is-ok');
        this.removeClass('is-fail');
        window.setTimeout(() => { this.addClass('noclip'); }, 800);
      }

      _createDescription(elm, data) {
        elm.innerHTML = util.httpLink(data);
        const watchReg = /watch\/([a-z0-9]+)/;
        const isZenzaReady = this._isZenzaReady;
        //if (util.isFirefox()) { return; }
        Array.from(elm.querySelectorAll('.videoLink[href*=\'watch/\']')).forEach((link) => {
          const href = link.getAttribute('href');
          if (!watchReg.test(href)) { return; }
          const watchId = RegExp.$1;
          if (isZenzaReady) {
            link.classList.add('noHoverMenu');
            link.classList.add('command');
            link.setAttribute('data-command', 'zenza-open');
            link.setAttribute('data-param', watchId);
          }
          const label = document.createElement('span');
          label.className = 'label';
          label.textContent = link.textContent;
          link.textContent = '';
          link.append(label);

          const btn = document.createElement('button');
          btn.innerHTML = '？';
          btn.className = 'command command-button noHoverMenu';
          btn.setAttribute('slot', 'command-button');
          btn.setAttribute('tooltip', '動画情報');
          btn.setAttribute('data-command', 'info');
          btn.setAttribute('data-param', watchId);
          link.appendChild(btn);

          const thumbnail = util.getThumbnailUrlByVideoId(watchId);
          const img = document.createElement('img');
          img.className = 'videoThumbnail preview';
          img.src = 'https://nicovideo.cdn.nimg.jp/uni/img/common/video_deleted.jpg';//(thumbnail || '').replace(/^http:/, '');
          link.classList.add('popupThumbnail');
          link.appendChild(img);

          link.dataset.videoId = watchId;
          link.classList.add('watch');
        });
      }

      _bindFail(videoInfo) {
        this._slot['error-description'].textContent =
          `動画情報の取得に失敗しました (${videoInfo.description})`;
        this.addClass('is-fail');
        this.removeClass('is-ok');
      }


      _createTagSlot(tag, {isChannel, owner}) {
        const text = util.escapeHtml(tag.text);
        const lock = tag.isLocked ? 'is-locked' : '';
        const span = document.createElement('span');
        const ownerId = owner ? owner.id : '';

        const a = document.createElement('a');
        const target = this._config.props.openNewWindow ? '_blank' : '_self';
        a.textContent = tag.text;
        a.className = `tag ${lock}`;
        a.target    = target;
        a.rel       = 'noopener';
        a.href      = `https://www.nicovideo.jp/tag/${encodeURIComponent(text)}`;
        span.appendChild(a);

        if (isChannel) {
          const ch = document.createElement('a');
          const target = this._config.props.openNewWindow ? '_blank' : '_self';
          ch.textContent = '[ch]';
          ch.className = `tag ${lock} channel-search`;
          ch.target    = target;
          ch.rel       = 'noopener';
          ch.title     = 'チャンネル検索';
          //ch.href      = `http://ch.nicovideo.jp/search/${encodeURIComponent(text)}?channel_id=ch${ownerId}&type=video&mode=t`;
          ch.href      = `https://ch.nicovideo.jp/search/${encodeURIComponent(text)}?type=video&mode=t`;
          span.appendChild(ch);
        }

        const fav = document.createElement('button');
        fav.className = 'add-fav-button command';
        fav.setAttribute('data-command', 'toggle-fav-tag');
        fav.setAttribute('data-tag', tag.text);
        fav.innerHTML = '★'; //'&#8416;'; // &#x2716;
        span.appendChild(fav);

        const bt = document.createElement('button');
        bt.className = 'add-ng-button command';
        bt.setAttribute('data-command', 'toggle-ng-tag');
        bt.setAttribute('data-tag', tag.text);
        bt.innerHTML = '&#x2716;'; //'&#8416;'; // &#x2716;
        span.appendChild(bt);

        const menu = `<zenza-tag-item-menu
          class="tagItemMenu"
          data-text="${encodeURIComponent(text)}"
          data-has-nicodic="0"
        ></zenza-tag-item-menu>`;
        span.insertAdjacentHTML('afterbegin', menu);

        span.className = 'tag-container';
        span.setAttribute('data-tag', tag.text);
        span.slot = 'tag';
        return span;
      }

      notifyBeginDeflistUpdate(/*watchId*/) {
        this.addClass('is-deflistUpdating');
      }

      notifyEndDeflistUpdate(result) {
        this.addClass('is-deflistSuccess');
        window.setTimeout(() => { this.removeClass('is-deflistSuccess'); }, 3000);

        this._deflistButton.setAttribute('data-result', result.message || '登録しました');
        this.removeClass('is-deflistUpdating');
      }

      notifyFailDeflistUpdate(result) {
        this.addClass('is-deflistFail');
        window.setTimeout(() => { this.removeClass('is-deflistFail'); }, 3000);

        this._deflistButton.setAttribute('data-result', result.message || '登録失敗');
        this.removeClass('is-deflistUpdating');
      }
    }


    class VideoInfo {
      static createByThumbInfo(thumbInfo) {
        let thumbnail = thumbInfo.thumbnail;
        if (util.hasLargeThumbnail(thumbInfo.videoId)) {
          thumbnail = thumbnail.replace(/\.[ML]$/) + '.L';
        }
        const owner = thumbInfo.owner || {};
        const isChannel = thumbInfo.isChannel;
        const rawData = {
          status:  thumbInfo.status,
          videoId: thumbInfo.id,
          watchId: thumbInfo.v,
          videoTitle: thumbInfo.title,
          videoThumbnail: thumbnail,
          uploadDate:     thumbInfo.postedAt,
          duration:       textUtil.secToTime(thumbInfo.duration),
          viewCounter:    thumbInfo.viewCount,
          mylistCounter:  thumbInfo.mylistCount,
          commentCounter: thumbInfo.commentCount,
          description:    thumbInfo.description,
          lastResBody:    thumbInfo.lastResBody,
          isChannel,
          ownerId:   owner.id,
          ownerName: owner.name,
          ownerIcon: owner.icon,
          tags: thumbInfo.tagList.map(tag => { return {text: tag.text, isLocked: tag.lock}; })
        };

        return new VideoInfo(rawData);
      }

      constructor(rawData) {
        this._rawData = rawData;
      }

      get status()           { return this._rawData.status; }
      get videoId()          { return this._rawData.videoId; }
      get watchId()          { return this._rawData.watchId; }
      get originalVideoId() {
        return (!this.isChannel && this.videoId !== this.watchId) ? this.videoId : '';
      }
      get videoTitle()       { return this._rawData.videoTitle; }
      get videoThumbnail()   { return this._rawData.videoThumbnail; }
      get description()      { return this._rawData.description; }
      get duration()         { return this._rawData.duration; }
      get owner() {
        return {
          type: this.isChannel ? 'channel' : 'user',
          id:   this.ownerId,
          linkId: this.ownerId ? (this.isChannel ? `ch${this.ownerId}` : `user/${this.ownerId}`) : 'xx',
          name: this.ownerName,
          icon: this.ownerIcon
        };
      }

      get ownerPageLink()  {
        const ownerId = this.ownerId;
        if (this.isChannel) {
          return `${protocol}//ch.nicovideo.jp/ch${ownerId}`;
        } else {
          return `${protocol}//www.nicovideo.jp/user/${ownerId}`;
        }
      }
      get ownerIcon()      { return this._rawData.ownerIcon; }
      get ownerName()      { return this._rawData.ownerName; }
      get localeOwnerName() {
        if (this.isChannel) {
          return this.ownerName;
        } else {
          // TODO: 言語依存
          return this.ownerName + ' さん';
        }
      }
      get ownerId()        { return this._rawData.ownerId; }
      get isChannel()      { return this._rawData.isChannel; }
      get uploadDate()     { return new Date(this._rawData.uploadDate); }

      get viewCounter()    { return this._rawData.viewCounter; }
      get mylistCounter()  { return this._rawData.mylistCounter; }
      get commentCounter() { return this._rawData.commentCounter; }

      get lastResBody()    { return this._rawData.lastResBody; }
      get tags() { return this._rawData.tags; }
    }



    const deflistAdd = (watchId) => {
      const enableAutoComment = config.props.mylist.enableAutoComment;
      if (location.host === 'www.nicovideo.jp') {
        return (() => {
          if (!enableAutoComment) { return Promise.resolve({}); }
          return ThumbInfoLoader.load(watchId);
        })().then((info) => {
          const originalVideoId = info.originalVideoId ?
            `元動画: ${info.originalVideoId}` : '';
          const description = enableAutoComment ?
            `投稿者: ${info.owner.name} ${info.owner.linkId} ${originalVideoId}` : '';
          return MylistApiLoader.addDeflistItem(watchId, description)
        });
      }

      let zenza;
      let token;
      return ZenzaDetector.detect().then((z) => {
        zenza = z;
      }).then(() => {
        return CsrfTokenLoader.load().then((t) => {
          token = t;
        }, () => { return Promise.resolve(); });
      }).then(() => {
        if (!enableAutoComment) { return {}; }
        return ThumbInfoLoader.load(watchId);
      }).then((info) => {
        if (!enableAutoComment) {
          return zenza.external.deflistAdd({watchId, token});
        }

        const originalVideoId = info.originalVideoId ?
          `元動画: ${info.originalVideoId}` : '';
        const description = enableAutoComment ?
          `投稿者: ${info.owner.name} ${info.owner.linkId} ${originalVideoId}` : '';
        return zenza.external.deflistAdd({watchId, description, token});
      });
    };

    const deflistRemove = (watchId) => {
      if (location.host === 'www.nicovideo.jp') {
        return MylistApiLoader.removeDeflistItem(watchId);
      }

      let zenza;
      let token;
      return ZenzaDetector.detect().then((z) => {
        zenza = z;
      }).then(() => {
        return CsrfTokenLoader.load().then((t) => {
          token = t;
        }, () => { return Promise.resolve(); });
      }).then(() => {
        return zenza.external.deflistRemove({watchId, token});
      });

    };



    class MatchChecker {
      constructor({word = '', tag = '', owner = ''}) {
        this.init({word, tag, owner});
      }

      init({word, tag, owner}) {
        this._tag = [];
        tag.split(/[\r\n]+/).forEach((t) => {
          if (t) { this._tag.push(t.trim()); }
        });
        this._tag = _.uniq(this._tag);

        let wordTmp = [];
        this._word = null;
        word.split(/[\r\n]+/).forEach((w) => {
          if (w) { wordTmp.push(util.escapeRegs(w.trim())); }
        });
        wordTmp = _.uniq(wordTmp);
        if (wordTmp.length > 0) {
          this._word = new RegExp('(' + wordTmp.join('|') + ')', 'i');
        }

        this._userId    = [];
        this._channelId = [];
        owner.split(/[\r\n]+/).forEach((o) => {
          if (typeof o === 'string') {
            const id = o.split('#')[0].trim();
            if (id.startsWith('ch')) {
              this._channelId.push(parseInt(id.substring(2)));
            } else {
              this._userId.push(parseInt(id));
            }
          }
        });
        this._userId    = _.uniq(this._userId);
        this._channelId = _.uniq(this._channelId);

      }

      isMatch(data) {
        if (this._isMatchTag(data.tagList)) { return true; }
        if (this._isMatchOwner(data.owner)) { return true; }
        if (this._isMatchWord({title: data.title, description: data.description})) { return true; }
      }

      _isMatchTag(tagList = []) {
        if (this._tag.length < 1) { return false; }

        const tagTmp = [];
        tagList.forEach(t => { if (t) { tagTmp.push(util.escapeRegs(t.trim ? t.trim() : t.text.trim())); } });
        const tagReg = new RegExp(' (' + tagTmp.join('|') + ') ', 'i');
        const _tag = ' ' + this._tag.join(' ') + ' ';
        return tagReg.test(_tag);
      }

      _isMatchOwner(owner) {
        const _id = owner.type === 'user' ? this._userId : this._channelId;
        return _id.includes(parseInt(owner.id, 10));
      }

      _isMatchWord({title, description}) {
        if (!this._word) { return false; }
        return this._word.test(title) || this._word.test(description);
      }

      isMatchTag(tag) {
        return this._isMatchTag([tag]);
      }

      isMatchOwner(owner) {
        return this._isMatchOwner(owner);
      }
    }

    class NgChecker extends MatchChecker {
      isNg(data) {
        return super.isMatch(data);
      }
    }

    const initDom = () => {
      util.addStyle(__css__);
      const f = document.createElement('div');
      f.id = 'mylistPocketDomContainer';
      f.innerHTML = __tpl__;
      document.body.appendChild(f);
    };

    const initZenzaBridge = () => {
      ZenzaDetector.initialize();
    };

    const createVideoInfoView = () => {
      const host = document.getElementById('mylistPocket-popup');
      const tpl  = document.getElementById('mylistPocket-popup-template');
      const vv = new VideoInfoView({host, tpl});
      return vv;
    };

    const createVideoInfoLoader = vv => {

      const onVideoInfoLoad = thumbInfo => {
        const vi = VideoInfo.createByThumbInfo(thumbInfo);
        vv.bind(vi);
      };

      const onVideoInfoFail = () => {
        vv.bind({status: 'fail', description: '通信失敗'});
        return Promise.resolve();
      };

      return watchId => {
        vv.reset();
        vv.show();
        return ThumbInfoLoader.load(watchId, {expireTime: 60 * 60 * 1000}).then(onVideoInfoLoad, onVideoInfoFail);
      };
    };

    const createCommandDispatcher = ({infoView}) => {
      const info = createVideoInfoLoader(infoView);

      const ngConfig  = config.namespace('ng');
      const favConfig = config.namespace('fav');
      const {ngChecker, favChecker} = initNgChecker({ngConfig, favConfig});

      const toggleFavNg = (command, param) => {
        let [cmd, namespace, key] = command.split('-');
        let _config = namespace === 'fav' ? favConfig : ngConfig;
        _config.refresh();
        const value = param.value.trim();
        let ngs = _config.props[key].trim().split(/[\r\n]/);
        const isContain = ngs.includes(value);

        if (isContain || cmd === 'remove') {
          ngs = ngs.filter((line) => {
            if (line === value) {
              window.console.info('%c-%s:%s', 'background: cyan', key, value);
            }
            return line !== value;
          });
          cmd = 'remove';
        } else if (!isContain || cmd === 'add') {
          ngs.push(value);
          window.console.info('%c+%s:%s', 'background: cyan', key, value);
          cmd = 'add';
        }

        ngs = _.uniq(ngs);

        _config.props[key] = ngs.join('\n').trim();

        const className = namespace === 'fav' ? 'is-fav-favorited' : 'is-ng-rejected';
        Array.prototype.forEach.call(
          document.querySelectorAll(`*[data-watch-id=${param.watchId}]`),
          item => { item.classList.toggle(className, cmd === 'add'); });
      };

      return (command, param, src) => {
        switch(command) {
          case 'info':
            return info(param);
          case 'load':
            return QueueLoader.load(param);
          case 'fav-status':
            return QueueLoader.load(param).then((result) => {
              if (!result || result.status === 'fail' || result.code === 'DELETED') {
                return Promise.reject({status: 'unknown', result});
              }
              if (ngChecker.isMatch(result)) {
                return {status: 'ng', result};
              }
              if (favChecker.isMatch(result)) {
                return {status: 'favorite', result};
              }
              return {status: 'default', result};
            });
          case 'mylist-window':
            window.open(
             protocol + '//www.nicovideo.jp/mylist_add/video/' + param,
             'nicomylistadd',
             'width=500, height=400, menubar=no, scrollbars=no');
            break;
          case 'twitter-hash-open':
            window.open('https://twitter.com/hashtag/' + param + '?src=hash');
            break;
          case 'open-mylist-open':
            window.open(protocol + '//www.nicovideo.jp/openlist/' + param);
            break;
          case 'mylist-comment-open':
            window.open(protocol + '//www.nicovideo.jp/mylistcomment/video/' + param);
            break;
           case 'zenza-open-now':
            if (window.ZenzaWatch.config &&
              window.ZenzaWatch.config.getValue('enableSingleton')) {
              window.ZenzaWatch.external.sendOrExecCommand('openNow', param);
            } else {
              window.ZenzaWatch.external.execCommand('openNow', param);
            }
            break;
          case 'zenza-open':
            if (window.ZenzaWatch.config.getValue('enableSingleton')) {
              window.ZenzaWatch.external.sendOrOpen(param);
            } else {
              window.ZenzaWatch.external.open(param);
            }
            break;
          case 'playlist-inert':
            window.ZenzaWatch.external.playlist.insert(param);
            break;
          case 'playlist-queue':
            window.ZenzaWatch.external.playlist.add(param);
            break;
          case 'deflist-add':
            src.notifyBeginDeflistUpdate('is-deflistUpdating');

            return deflistAdd(param)
              .then(util.getSleepPromise(1000, 'deflist-add'))
              .then((result) => {
                src.notifyEndDeflistUpdate(result);
              }, (err) => {
                console.error('deflist-add-result', err);
                src.notifyFailDeflistUpdate(err);
              });
          case 'deflist-remove':
            src.notifyBeginDeflistUpdate('is-deflistUpdating');

            return deflistRemove(param)
              .then(util.getSleepPromise(1000, 'deflist-remove'))
              .then(() => {
                src.notifyEndDeflistUpdate({message: '削除しました'});
              }, (err) => {
                console.error('deflist-remove-result', err);
                src.notifyFailDeflistUpdate(err);
              });
          case 'add-ng-word':  case 'add-ng-tag':  case 'add-ng-owner':
          case 'add-fav-word': case 'add-fav-tag': case 'add-fav-owner':
          case 'remove-ng-word':  case 'remove-ng-tag':  case 'remove-ng-owner':
          case 'remove-fav-word': case 'remove-fav-tag': case 'remove-fav-owner':
          case 'toggle-ng-word':  case 'toggle-ng-tag':  case 'toggle-ng-owner':
          case 'toggle-fav-word': case 'toggle-fav-tag': case 'toggle-fav-owner':
            toggleFavNg(command, param);
            break;
        }
      };
    };

    const initExternal = (dispatcher, hoverMenu, infoView) => {
      MylistPocket.external = {
        info: watchId => { return dispatcher('info', watchId); },
        load: watchId => { return dispatcher('load', watchId, {expireTime: 60 * 60 * 1000}); },
        getFavStatus: (watchId) => { return dispatcher('fav-status', watchId); },
        observe: (params /*{query, container, closest}*/) => { initNg(params); },
        hide: () => {
          hoverMenu.hide();
          infoView.hide();
        }
      };

      MylistPocket.isReady = true;

      const ev = new CustomEvent('MylistPocketInitialized', { detail: { MylistPocket } });
      document.body.dispatchEvent(ev);
      // 過去の互換用
      if (window.jQuery) {
        window.jQuery('body').trigger('MylistPocketReady', MylistPocket);
      }
    };


    const QueueLoader = (() => {
      let lastPromise = null;
      let count = 0;
      const MAX_LOAD = 6;
      const promises = [];

      const load = function(watchId, item) {
        count = (count + 1) % MAX_LOAD;
        lastPromise = promises[count];

        const onLoad = info => {
          if (item) {
            watchId = info.watchId;
            item.setAttribute('data-watch-id', watchId);
            item.setAttribute('data-thumb-info', JSON.stringify(info));
          }
          const sleepTime = info.fromCache ? 0 : 50;
          return (util.getSleepPromise(sleepTime,  'success-' + watchId))(info);
        };
        const onFail = util.getSleepPromise(1000, 'fail-'    + watchId);

        if (!lastPromise) {
          if (item) { item.classList.add('is-ng-current'); }
          lastPromise = ThumbInfoLoader.load(watchId).then(onLoad, onFail);
        } else {
          //lastPromise = Promise.all([lastPromise]).then(() => {
          lastPromise = Promise.race(promises).then(() => {
            if (item) { item.classList.add('is-ng-current'); }
            return ThumbInfoLoader.load(watchId).then(onLoad, onFail);
          });
        }

        promises[count] = lastPromise;
        return lastPromise;
      };

      return {
        load
      };
    })();

    const waitForDom = (query, timeout = 30000) => {
      const now = Date.now();
      return new Promise(async (ok, ng) => {
        while (now + timeout > Date.now()) {
          const dom = document.querySelector(query);
          console.log('waitForDom', query, dom, now + timeout, Date.now());
          if (dom) {
            return ok(dom);
          }
          await new Promise(wait => setTimeout(wait, 1000));
        }
        ng('timeout');
      });
    };

    const getNgEnv = async () => {
      if (location.host === 'www.nicovideo.jp' &&
         (location.pathname.startsWith('/ranking') ||
          location.pathname.startsWith('/tag')     ||
          location.pathname.startsWith('/search'))
      ) {
        if (document.querySelector('#MatrixRanking-app')) {
          await waitForDom('.RankingMatrixVideosRow');
        }
        return {
          query:
            '.item[data-video-id]:not(.is-ng-wait), .item_cell[data-video-id]:not(.is-ng-wait), '+
            '.VideoItem:not(.is-ng-wait), .RankingMainVideo[data-video-id]:not(.is-ng-wait)',
          container:
            Array.from(
              document.querySelectorAll(
                '.contentBody .list, .container.column1024-0,'+
                '.RankingMatrixVideosRow, '+
                '.RankingMainContainer, .RankingVideoListContainer')
            ),
          subtree: false
        };
      }
      if (location.host === 'www.nicovideo.jp' &&
          document.querySelector('#MyPageNicorepoApp, #UserPageNicorepoApp')) {
        return {
          query: '.NicorepoTimelineItem:not(.is-ng-wait)',
          container: document.querySelector('#MyPageNicorepoApp, #UserPageNicorepoApp'),
        };
      }

      if (location.host === 'ch.nicovideo.jp' &&
          location.pathname.startsWith('/search')) {
        return {
          query: '.item:not(.is-ng-wait)',
          container: document.querySelector('.site_body')
        };
      }

      if (location.host === 'search.nicovideo.jp') {
        return {
          query: '.video:not(.is-ng-wait)',
          container: document.querySelector('#row-results')
        };
      }


      return {query: null, container: null};
    };

    const initNgConfig = () => {
      const ngConfig = config.namespace('ng');
      const updateEnable = v => { document.body.classList.toggle('is-ng-disable', !v); };
      updateEnable(ngConfig.props.enable);
      if (!ngConfig.props.enable) { return {}; }
      ngConfig.onkey('enable', updateEnable);

      const favConfig = config.namespace('fav');
      return {ngConfig, favConfig};
    };

    const initNgChecker = ({ngConfig, favConfig}) => {
      const ngChecker = new NgChecker({
        word:  ngConfig.props.word,
        tag:   ngConfig.props.tag,
        owner: ngConfig.props.owner
      });

      ngConfig.on('update', bounce.time(({key, value}) => {
        ngChecker.init({
          word:  ngConfig.props.word,
          tag:   ngConfig.props.tag,
          owner: ngConfig.props.owner
        });
      }, 100));


      const favChecker = new MatchChecker({
        word:  favConfig.props.word,
        tag:   favConfig.props.tag,
        owner: favConfig.props.owner
      });

      favConfig.on('update', bounce.time(({key, value}) => {
        favChecker.init({
          word:  favConfig.props.word,
          tag:   favConfig.props.tag,
          owner: favConfig.props.owner
        });
      }, 100));

       return {ngChecker, favChecker};
    };

    const initIntersectionObserver = onInview => {

      const onItemInview = item => {
        let watchId = item.getAttribute('data-id') ||
          item.getAttribute('data-video-id') ||
          item.getAttribute('data-watch-id');
        const ignore = () => item.classList.add('is-ng-ignore');
        if (!watchId) {
          const a = item.querySelector('a[href*=\'watch/\']');
          let m;
          if (!a) { return ignore(); }
          if (a.hostname !== 'www.nicovideo.jp') { return ignore(); }
          if ((m = /^\/watch\/([a-z0-9]+)/.exec(a.pathname)) === null) { return ignore(); }
          watchId = m[1];
        }

        if (!watchId) {
          item.classList.add('.no-watch-id');
          return ignore();
        }

        item.classList.add('is-ng-queue');
        onInview(item, watchId);
      };

      const intersectionObserver = new window.IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).forEach(entry => {
          const item = entry.target;
          intersectionObserver.unobserve(item);
          onItemInview(item);
        });
      }, { rootMargin: '400px'});

      return intersectionObserver;
    };

    const initNgDom = ({intersectionObserver, query, closest, container, subtree}) => {
      subtree = typeof subtree !== 'boolean' ? false : subtree;
      if (!container) { return; }
      util.addStyle(__ng_css__);

      const update = container => {
        let items = (container || document).querySelectorAll(query);
        if (!items || items.length < 1) { return; }
        if (closest) {
          let tmp = [];
          [...items].forEach(item => {
            const c = item.closest(closest);
            if (c && !tmp.includes(c)) {
              tmp.push(c);
            }
          });
          items = tmp;
        }
        if (!items || items.length < 1) { return; }
        [...items].forEach(item => {
          //if (item.offsetLeft < 0) { return; }
          if (item.classList.contains('is-ng-ignore')) { return; }
          item.classList.add('is-ng-wait');
          intersectionObserver.observe(item);
        });
      };
      update();

      if (!container) { return; }
      const mutationObserver = new MutationObserver(mutations => {
        for (const record of mutations) {
          const container = record.target;
          if (record.addedNodes && record.addedNodes.length) {
            update(container);
          }
        }
      });

      const containers = Array.isArray(container) ? container : [container];
      containers.forEach(container => {
        container.dataset.isWatching = 1;
        mutationObserver.observe(
          container,
          {childList: true, characterData: false, attributes: false, subtree}
        );
      });

    };

    const initNg = async params => {
      if (!window.IntersectionObserver) { return; }

      let {query, container, closest, subtree, callback} = params ? params : await getNgEnv();

      if (!query) { return; }

      const {ngConfig, favConfig} = initNgConfig();
      if (!ngConfig) { return; }

      const {ngChecker, favChecker} = initNgChecker({ngConfig, favConfig});

      const onItemInview = (item, watchId) => {

        const loadLazy = () => {
          const lazyImage = item.querySelector('.jsLazyImage');
          if (lazyImage) {
            const origImage = lazyImage.getAttribute('data-original');
            if (origImage) {
              lazyImage.src = origImage;
              lazyImage.classList.remove('jsLazyImage');
            }
          }
        };

        QueueLoader.load(watchId, item).then(
          info => {
            item.classList.remove('is-ng-current');
            if (!info || info.status === 'fail' || info.code === 'DELETED') {
              if (info && info.code !== 'COMMUNITY') {
                console.error('empty data', watchId, info, info ? info.code : 'unknown');
              }
              item.classList.add('is-ng-failed', info ? info.code : 'is-no-data');
            } else {
              if (callback) {
                return callback(item,
                  {watchId, info, isNg: ngChecker.isNg(info), isFav: favChecker.isMatch(info)});
              }
              item.classList.add(
                ngChecker.isNg(info) ? 'is-ng-rejected' : 'is-ng-resolved');
              if (favChecker.isMatch(info)) {
                item.classList.add('is-fav-favorited');
              }

              for (let img of item.querySelectorAll('img.videoThumbnail.preview')) {
                img.src = info.thumbnail;
              }

              let label = item.querySelector('.label');
              item.dataset.title = info.title;
              // チャンネル動画のリンクを watch/so〜 に置き換える
              if (!(info.id || '').startsWith('so')) { return; }
              if (label &&
                  item.classList.contains('videoLink')
              ) {
                label.textContent = info.id;
                item.dataset.param = item.dataset.videoId = info.id;
                item.href = `https://www.nicovideo.jp/watch/${info.id}`;
              }
              for (let a of item.querySelectorAll(`a[href*="watch/${watchId}"]`)) {
                let href = a.getAttribute('href');
                href = href.replace(/watch\/([0-9]+)/, `watch/${info.id}`);
                a.setAttribute('href', href.replace(/^http:/, 'https:'));
              }
            }

            loadLazy();
          },
          () => {
            item.classList.remove('is-ng-current');
            item.classList.add('is-ng-failed');
            loadLazy();
          }
        );
      };

      const intersectionObserver = initIntersectionObserver(onItemInview);

      initNgDom({intersectionObserver, query, container, closest, subtree});

      return intersectionObserver;
    };

    const init = async () => {
      await config.promise('restore');
      initDom();
      initZenzaBridge();

      const infoView = createVideoInfoView();
      const dispatcher = createCommandDispatcher({infoView});

      infoView.on('command', dispatcher);

      const hoverMenu = new HoverMenu();
      hoverMenu.on('info', (watchId) => {
        hoverMenu.isBusy = true;

        dispatcher('info', watchId)
          .then(() => { hoverMenu.isBusy = false; });
      });
      hoverMenu.on('deflist-add', (watchId, src) => {
        dispatcher('deflist-add', watchId, src);
      });
      hoverMenu.on('deflist-remove', (watchId, src) => {
        dispatcher('deflist-remove', watchId, src);
      });
      hoverMenu.on('playlist-queue', (watchId, src) => {
        dispatcher('playlist-queue', watchId, src);
      });
      MylistPocket.debug.hoverMenu = hoverMenu;

      initNg();

      if (config.props.nicoad.hide) {
        util.addStyle(nicoadHideCss);
      }
      if (document.body.classList.contains('MatrixRanking-body') &&
          config.props.responsive.matrix) {
        util.addStyle(responsiveCss);
      }

      initExternal(dispatcher, hoverMenu, infoView);
    };

    init();
  };
function EmitterInitFunc() {
class Handler { //extends Array {
	constructor(...args) {
		this._list = args;
	}
	get length() {
		return this._list.length;
	}
	exec(...args) {
		if (!this._list.length) {
			return;
		} else if (this._list.length === 1) {
			this._list[0](...args);
			return;
		}
		for (let i = this._list.length - 1; i >= 0; i--) {
			this._list[i](...args);
		}
	}
	execMethod(name, ...args) {
		if (!this._list.length) {
			return;
		} else if (this._list.length === 1) {
			this._list[0][name](...args);
			return;
		}
		for (let i = this._list.length - 1; i >= 0; i--) {
			this._list[i][name](...args);
		}
	}
	add(member) {
		if (this._list.includes(member)) {
			return this;
		}
		this._list.unshift(member);
		return this;
	}
	remove(member) {
		this._list = this._list.filter(m => m !== member);
		return this;
	}
	clear() {
		this._list.length = 0;
		return this;
	}
	get isEmpty() {
		return this._list.length < 1;
	}
	*[Symbol.iterator]() {
		const list = this._list || [];
		for (const member of list) {
			yield member;
		}
	}
	next() {
		return this[Symbol.iterator]();
	}
}
Handler.nop = () => {/*     ( ˘ω˘ ) スヤァ    */};
const PromiseHandler = (() => {
	const id = function() { return `Promise${this.id++}`; }.bind({id: 0});
	class PromiseHandler extends Promise {
		constructor(callback = () => {}) {
			const key = new Object({id: id(), callback, status: 'pending'});
			const cb = function(res, rej) {
				const resolve = (...args) => { this.status = 'resolved'; this.value = args; res(...args); };
				const reject  = (...args) => { this.status = 'rejected'; this.value = args; rej(...args); };
				if (this.result) {
					return this.result.then(resolve, reject);
				}
				Object.assign(this, {resolve, reject});
				return callback(resolve, reject);
			}.bind(key);
			super(cb);
			this.resolve = this.resolve.bind(this);
			this.reject = this.reject.bind(this);
			this.key = key;
		}
		resolve(...args) {
			if (this.key.resolve) {
				this.key.resolve(...args);
			} else {
				this.key.result = Promise.resolve(...args);
			}
			return this;
		}
		reject(...args) {
			if (this.key.reject) {
				this.key.reject(...args);
			} else {
				this.key.result = Promise.reject(...args);
			}
			return this;
		}
		addCallback(callback) {
			Promise.resolve().then(() => callback(this.resolve, this.reject));
			return this;
		}
	}
	return PromiseHandler;
})();
const {Emitter} = (() => {
	let totalCount = 0;
	let warnings = [];
	class Emitter {
		on(name, callback) {
			if (!this._events) {
				Emitter.totalCount++;
				this._events = new Map();
			}
			name = name.toLowerCase();
			let e = this._events.get(name);
			if (!e) {
				const handler = new Handler(callback);
				handler.name = name;
				e = this._events.set(name, handler);
			} else {
				e.add(callback);
			}
			if (e.length > 10) {
				console.warn('listener count > 10', name, e, callback);
				!Emitter.warnings.includes(this) && Emitter.warnings.push(this);
			}
			return this;
		}
		off(name, callback) {
			if (!this._events) {
				return;
			}
			name = name.toLowerCase();
			const e = this._events.get(name);
			if (!this._events.has(name)) {
				return;
			} else if (!callback) {
				this._events.delete(name);
			} else {
				e.remove(callback);
				if (e.isEmpty) {
					this._events.delete(name);
				}
			}
			if (this._events.size < 1) {
				delete this._events;
			}
			return this;
		}
		once(name, func) {
			const wrapper = (...args) => {
				func(...args);
				this.off(name, wrapper);
				wrapper._original = null;
			};
			wrapper._original = func;
			return this.on(name, wrapper);
		}
		clear(name) {
			if (!this._events) {
				return;
			}
			if (name) {
				this._events.delete(name);
			} else {
				delete this._events;
				Emitter.totalCount--;
			}
			return this;
		}
		emit(name, ...args) {
			if (!this._events) {
				return;
			}
			name = name.toLowerCase();
			const e = this._events.get(name);
			if (!e) {
				return;
			}
			e.exec(...args);
			return this;
		}
		emitAsync(...args) {
			if (!this._events) {
				return;
			}
			setTimeout(() => this.emit(...args), 0);
			return this;
		}
		promise(name, callback) {
			if (!this._promise) {
				this._promise = new Map;
			}
			const p = this._promise.get(name);
			if (p) {
				return callback ? p.addCallback(callback) : p;
			}
			this._promise.set(name, new PromiseHandler(callback));
			return this._promise.get(name);
		}
		emitResolve(name, ...args) {
			if (!this._promise) {
				this._promise = new Map;
			}
			if (!this._promise.has(name)) {
				this._promise.set(name, new PromiseHandler());
			}
			return this._promise.get(name).resolve(...args);
		}
		emitReject(name, ...args) {
			if (!this._promise) {
				this._promise = new Map;
			}
			if (!this._promise.has(name)) {
				this._promise.set(name, new PromiseHandler);
			}
			return this._promise.get(name).reject(...args);
		}
		resetPromise(name) {
			if (!this._promise) { return; }
			this._promise.delete(name);
		}
		hasPromise(name) {
			return this._promise && this._promise.has(name);
		}
		addEventListener(...args) { return this.on(...args); }
		removeEventListener(...args) { return this.off(...args);}
	}
	Emitter.totalCount = totalCount;
	Emitter.warnings = warnings;
	return {Emitter};
})();
	return {Handler, PromiseHandler, Emitter};
}
const {Handler, PromiseHandler, Emitter} = EmitterInitFunc();
function parseThumbInfo(xmlText) {
	if (typeof xmlText !== 'string' || xmlText.status === 'ok') {
		return xmlText;
	}
	const parser = new DOMParser();
	const xml = parser.parseFromString(xmlText, 'text/xml');
	const val = name => {
		const elms = xml.getElementsByTagName(name);
		if (elms.length < 1) {
			return null;
		}
		return elms[0].textContent;
	};
	const dateToString = dateString => {
		const date = new Date(dateString);
		const [yy, mm, dd, h, m, s] = [
				date.getFullYear(),
				date.getMonth() + 1,
				date.getDate(),
				date.getHours(),
				date.getMinutes(),
				date.getSeconds()
			].map(n => n.toString().padStart(2, '0'));
		return `${yy}/${mm}/${dd} ${h}:${m}:${s}`;
	};
	const resp = xml.getElementsByTagName('nicovideo_thumb_response');
	if (resp.length < 1 || resp[0].getAttribute('status') !== 'ok') {
		return {
			status: 'fail',
			code: val('code'),
			message: val('description')
		};
	}
	const [min, sec] = val('length').split(':');
	const duration = min * 60 + sec * 1;
	const watchId = val('watch_url').split('/').reverse()[0];
	const postedAt = dateToString(new Date(val('first_retrieve')));
	const tags = [...xml.getElementsByTagName('tag')].map(tag => {
			return {
				text: tag.textContent,
				category: tag.hasAttribute('category'),
				lock: tag.hasAttribute('lock')
			};
		});
	const videoId = val('video_id');
	const isChannel = videoId.substring(0, 2) === 'so';
	const result = {
		status: 'ok',
		_format: 'thumbInfo',
		v: isChannel ? videoId : watchId,
		id: videoId,
		videoId,
		watchId: isChannel ? videoId : watchId,
		originalVideoId: (!isChannel && watchId !== videoId) ? videoId : '',
		isChannel,
		title: val('title'),
		description: val('description'),
		thumbnail: val('thumbnail_url').replace(/^http:/, 'https:'),
		movieType: val('movie_type'),
		lastResBody: val('last_res_body'),
		duration,
		postedAt,
		mylistCount: parseInt(val('mylist_counter'), 10),
		viewCount: parseInt(val('view_counter'), 10),
		commentCount: parseInt(val('comment_num'), 10),
		tagList: tags
	};
	const userId = val('user_id');
	if (userId !== null && userId !== '') {
		result.owner = {
			type: 'user',
			id: userId,
			linkId: userId ? `user/${userId}` : '',
			name: val('user_nickname') || '(非公開ユーザー)',
			url: userId ? ('https://www.nicovideo.jp/user/' + userId) : '#',
			icon: val('user_icon_url') || 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg'
		};
	}
	const channelId = val('ch_id');
	if (channelId !== null && channelId !== '') {
		result.owner = {
			type: 'channel',
			id: channelId,
			linkId: channelId ? `ch${channelId}` : '',
			name: val('ch_name') || '(非公開チャンネル)',
			url: 'https://ch.nicovideo.jp/ch' + channelId,
			icon: val('ch_icon_url') || 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg'
		};
	}
	return result;
}
const workerUtil = (() => {
	let config, TOKEN, PRODUCT = 'ZenzaWatch?', netUtil, CONSTANT, NAME = '';
	let global = null, external = null;
	const isAvailable = !!(window.Blob && window.Worker && window.URL);
	const messageWrapper = function(self) {
		const _onmessage = self.onmessage || (() => {});
		const promises = {};
		const onMessage = async function(self, type, e) {
			const {body, sessionId, status} = e.data;
			const {command, params} = body;
			try {
				let result;
				switch (command) {
					case 'commandResult':
						if (promises[sessionId]) {
							if (status === 'ok') {
								promises[sessionId].resolve(params.result);
							} else {
								promises[sessionId].reject(params.result);
							}
							delete promises[sessionId];
						}
					return;
					case 'ping':
						result = {now: Date.now(), NAME, PID, url: location.href};
						break;
					case 'port': {
						const port = e.ports[0];
						portMap[params.name] = port;
						port.addEventListener('message', onMessage.bind({}, port, params.name));
						bindFunc(port, 'MessageChannel');
						if (params.ping) {
							console.time('ping:' + sessionId);
							port.ping().then(result => {
								console.timeEnd('ping:' + sessionId);
								console.log('ok %smec', Date.now() - params.now, params);
							}).catch(err => {
								console.timeEnd('ping:' + sessionId);
								console.warn('ping fail', {err, data: e.data});
							});
						}
					}
						return;
					case 'broadcast': {
						if (!BroadcastChannel) { return; }
						const channel = new BroadcastChannel(`${params.name}`);
						channel.addEventListener('message', onMessage.bind({}, channel, 'BroadcastChannel'));
						bindFunc(channel, 'BroadcastChannel');
						bcast[params.basename] = channel;
					}
						return;
					case 'env':
						({config, TOKEN, PRODUCT, CONSTANT} = params);
						return;
					default:
						result = await _onmessage({command, params}, type, PID);
						break;
					}
				self.postMessage({body:
					{command: 'commandResult', params:
						{command, result}}, sessionId, TYPE: type, PID, status: 'ok'
					});
			} catch(err) {
				console.error('failed', {err, command, params, sessionId, TYPE: type, PID, data: e.data});
				self.postMessage({body:
						{command: 'commandResult', params: {command, result: err.message || null}},
						sessionId, TYPE: type, PID, status: err.status || 'fail'
					});
			}
		};
		self.onmessage = onMessage.bind({}, self, self.name);
		self.onconnect = e => {
			const port = e.ports[0];
			port.onmessage = self.onmessage;
			port.start();
		};
		const bindFunc = (self, type = 'Worker') => {
			const post = function(self, body, options = {}) {
				const sessionId = `recv:${NAME}:${type}:${this.sessionId++}`;
				return new Promise((resolve, reject) => {
					promises[sessionId] = {resolve, reject};
					self.postMessage({body, sessionId, PID}, options.transfer);
					if (typeof options.timeout === 'number') {
						setTimeout(() => {
							reject({status: 'fail', message: 'timeout'});
							delete promises[sessionId];
						}, options.timeout);
					}
				}).finally(() => { delete promises[sessionId]; });
			};
			const emit = function(self, eventName, data = null) {
				self.post({command: 'emit', params: {eventName, data}});
			};
			const notify = function(self, message) {
				self.post({command: 'notify', params: {message}});
			};
			const alert = function(self, message) {
				self.post({command: 'alert', params: {message}});
			};
			const ping = async function(self, options = {}) {
				const timekey = `PING "${self.name}"`;
				console.log(timekey);
				let result;
				options.timeout = options.timeout || 10000;
				try {
					console.time(timekey);
					result = await self.post({command: 'ping', params: {now: Date.now(), NAME, PID, url: location.href}}, options);
					console.timeEnd(timekey);
				} catch (e) {
					console.timeEnd(timekey);
					console.warn('ping fail', e);
				}
				return result;
			};
			self.post = post.bind({sessionId: 0}, this.port || self);
			self.emit = emit.bind({}, self);
			self.notify = notify.bind({}, self);
			self.alert = alert.bind({}, self);
			self.ping = ping.bind({}, self);
			return self;
		};
		bindFunc(self);
		self.xFetch = async (url, options = {}) => {
			options = {...options, ...{signal: null}}; // remove AbortController
			if (url.startsWith(location.origin)) {
				return fetch(url, options);
			}
			const result = await self.post({command: 'fetch', params: {url, options}});
			const {buffer, init, headers} = result;
			const _headers = new Headers();
			(headers || []).forEach(a => _headers.append(...a));
			const _init = {
				status: init.status,
				statusText: init.statusText || '',
				headers: _headers
			};
			return new Response(buffer, _init);
		};
	};
	const workerUtil = {
		isAvailable,
		js: (q, ...args) => {
			const strargs = args.map(a => typeof a === 'string' ? a : a.toString);
			return String.raw(q, ...strargs);
		},
		env: params => {
			({config, TOKEN, PRODUCT, netUtil, CONSTANT, global} =
				Object.assign({config, TOKEN, PRODUCT, netUtil, CONSTANT, global}, params));
			if (global) { ({config, TOKEN, PRODUCT, CONSTANT} = global); }
		},
		create: function(func, options = {}) {
			let cache = this.urlMap.get(func);
			const name = options.name || 'Worker';
			if (!cache) {
				const src = `
				const PID = '${window && window.name || 'self'}:${location.href.replace(/\'/g, '\\\'')}:${name}:${Date.now().toString(16).toUpperCase()}';
				console.log('%cinit %s %s', 'font-weight: bold;', self.name || '', '${PRODUCT}', location.origin);
				(${func.toString()})(self);
				`;
				const blob = new Blob([src], {type: 'text/javascript'});
				const url = URL.createObjectURL(blob);
				this.urlMap.set(func, url);
				cache = url;
			}
			if (options.type === 'SharedWorker') {
				const w = this.workerMap.get(func) || new SharedWorker(cache);
				this.workerMap.set(func, w);
				return w;
			}
			return new Worker(cache, options);
		}.bind({urlMap: new Map(), workerMap: new Map()}),
		createCrossMessageWorker: function(func, options = {}) {
			const promises = this.promises;
			const name = options.name || 'Worker';
			const PID = `${window && window.name || 'self'}:${location.host}:${name}:${Date.now().toString(16).toUpperCase()}`;
			const _func = `
			function (self) {
			let config = {}, PRODUCT, TOKEN, CONSTANT, NAME = decodeURI('${encodeURI(name)}'), bcast = {}, portMap = {};
			const {Handler, PromiseHandler, Emitter} = (${EmitterInitFunc.toString()})();
			(${func.toString()})(self);
			//===================================
			(${messageWrapper.toString()})(self);
			}
			`;
			const worker = workerUtil.create(_func, options);
			const self = options.type === 'SharedWorker' ? worker.port : worker;
			self.name = name;
			const onMessage = async function(self, e) {
				const {body, sessionId, status} = e.data;
				const {command, params} = body;
				try {
					let result = 'ok';
					let transfer = null;
					switch (command) {
						case 'commandResult':
							if (promises[sessionId]) {
								if (status === 'ok') {
									promises[sessionId].resolve(params.result);
								} else {
									promises[sessionId].reject(params.result);
								}
								delete promises[sessionId];
							}
							return;
						case 'ping':
								result = {now: Date.now(), NAME, PID, url: location.href};
								console.timeLog && console.timeLog(params.NAME, 'PONG');
								break;
						case 'emit':
							global && global.emitter.emitAsync(params.eventName, params.data);
							break;
						case 'fetch':
							result = await (netUtil || window).fetch(params.url,
								Object.assign({}, params.options || {}, {_format: 'arraybuffer'}));
							transfer = [result.buffer];
							break;
						case 'notify':
							global && global.notify(params.message);
							break;
						case 'alert':
							global && global.alert(params.message);
							break;
						default:
							self.oncommand && (result = await self.oncommand({command, params}));
							break;
					}
					self.postMessage({body: {command: 'commandResult', params: {command, result}}, sessionId, status: 'ok'}, transfer);
				} catch (err) {
					console.error('failed', {err, command, params, sessionId});
					self.postMessage({body: {command: 'commandResult', params: {command, result: err.message || null}}, sessionId, status: err.status || 'fail'});
				}
			};
			const bindFunc = (self, type = 'Worker') => {
				const post = function(self, body, options = {}) {
					const sessionId = `send:${name}:${type}:${this.sessionId++}`;
					return new Promise((resolve, reject) => {
							promises[sessionId] = {resolve, reject};
							self.postMessage({body, sessionId, TYPE: type, PID}, options.transfer);
							if (typeof options.timeout === 'number') {
								setTimeout(() => {
									reject({status: 'fail', message: 'timeout'});
									delete promises[sessionId];
								}, options.timeout);
							}
						}).finally(() => { delete promises[sessionId]; });
				};
				const ping = async function(self, options = {}) {
					const timekey = `PING "${self.name}" total time`;
					window.console.log(`PING "${self.name}"...`);
					let result;
					options.timeout = options.timeout || 10000;
					try {
					window.console.time(timekey);
					result = await self.post({command: 'ping', params: {now: Date.now(), NAME: self.name, PID, url: location.href}}, options);
					window.console.timeEnd(timekey);
					} catch (e) {
						console.timeEnd(timekey);
						console.warn('ping fail', e);
					}
					return result;
				};
				self.post = post.bind({sessionId: 0}, self);
				self.ping = ping.bind({}, self);
				self.addEventListener('message', onMessage.bind({sessionId: 0}, self));
				self.start && self.start();
			};
			bindFunc(self);
			if (config) {
				self.post({
					command: 'env',
					params: {config: config.export(true), TOKEN, PRODUCT, CONSTANT}
				});
			}
			self.addPort = (port, options = {}) => {
				const name = options.name || 'MessageChannel';
				return self.post({command: 'port', params: {port, name}}, {transfer: [port]});
			};
			const channel = new MessageChannel();
			self.addPort(channel.port2);
			bindFunc(channel.port1, {name: 'MessageChannel'});
			self.bridge = async (worker, options = {}) => {
				const name = options.name || 'MessageChannelBridge';
				const channel = new MessageChannel();
				await self.addPort(channel.port1, {name: worker.name || name});
				await worker.addPort(channel.port2, {name: self.name || name});
				console.log('ping self -> other', await channel.port1.ping());
				console.log('ping other -> self', await channel.port2.ping());
			};
			self.BroadcastChannel = basename => {
				const name = `${basename || 'Broadcast'}${TOKEN || Date.now().toString(16)}`;
				self.post({command: 'broadcast', params: {basename, name}});
				const channel = new BroadcastChannel(name);
				channel.addEventListener('message', onMessage.bind({}, channel, 'BroadcastChannel'));
				bindFunc(channel, 'BroadcastChannel');
				return name;
			};
			self.ping()
				.catch(result => console.warn('FAIL', result));
			return self;
		}.bind({
			sessionId: 0,
			promises: {}
		})
	};
	return workerUtil;
})();
const IndexedDbStorage = (() => {
	const workerFunc = function(self) {
		const db = {};
		const controller = {
			async init({name, ver, stores}) {
				if (db[name]) {
					return Promise.resolve(db[name]);
				}
				return new Promise((resolve, reject) => {
					const req = indexedDB.open(name, ver);
					req.onupgradeneeded = e => {
						const _db = e.target.result;
						for (const meta of stores) {
							if(_db.objectStoreNames.contains(meta.name)) {
								_db.deleteObjectStore(meta.name);
							}
							const store = _db.createObjectStore(meta.name, meta.definition);
							const indexes = meta.indexes || [];
							for (const idx of indexes) {
								store.createIndex(idx.name, idx.keyPath, idx.params);
							}
							store.transaction.oncomplete = () => {
								console.log('store.transaction.complete', JSON.stringify({name, ver, store: meta}));
							};
						}
					};
					req.onsuccess = e => {
						db[name] = e.target.result;
						resolve(db[name]);
					};
					req.onerror = reject;
				});
			},
			close({name}) {
				if (!db[name]) {
					return;
				}
				db[name].close();
				db[name] = null;
			},
			async getStore({name, storeName, mode = 'readonly'}) {
				const db = await this.init({name});
				return new Promise(async (resolve, reject) => {
					const tx = db.transaction(storeName, mode);
					tx.onerror = reject;
					return resolve({
						store: tx.objectStore(storeName),
						transaction: tx
					});
				});
			},
			async put({name, storeName, data}) {
				const {store, transaction} = await this.getStore({name, storeName, mode: 'readwrite'});
				return new Promise((resolve, reject) => {
					const req = store.put(data);
					req.onsuccess = e => {
						transaction.commit && transaction.commit();
						resolve(e.target.result);
					};
					req.onerror = reject;
				});
			},
			async get({name, storeName, data: {key, index, timeout}}) {
				const {store} = await this.getStore({name, storeName});
				return new Promise((resolve, reject) => {
					const req =
						index ?
							store.index(index).get(key) : store.get(key);
					req.onsuccess = e => resolve(e.target.result);
					req.onerror = reject;
					if (timeout) {
						setTimeout(() => {
							reject(`timeout: key${key}`);
						}, timeout);
					}
				});
			},
			async updateTime({name, storeName, data: {key, index, timeout}}) {
				const record = await this.get({name, storeName, data: {key, index, timeout}});
				if (!record) {
					return null;
				}
				record.updatedAt = Date.now();
				this.put({name, storeName, data: record});
				return record;
			},
			async delete({name, storeName, data: {key, index}}) {
				const {store, transaction} = await this.getStore({name, storeName, mode: 'readwrite'});
				return new Promise((resolve, reject) => {
					let remove = 0;
					let range = IDBKeyRange.only(key);
					let req =
						index ?
							store.index(index).openCursor(range) : store.openCursor(range);
					req.onsuccess = e =>  {
						const result = e.target.result;
						if (!result) {
							transaction.commit && transaction.commit();
							return resolve(remove > 0);
						}
						result.delete();
						remove++;
						result.continue();
					};
					req.onerror = reject;
				});
			},
			async clear({name, storeName}) {
				const {store} = await this.getStore({name, storeName, mode: 'readwrite'});
				return new Promise((resolve, reject) => {
					const req = store.clear();
					req.onsuccess = e => {
						console.timeEnd('storage clear');
						resolve();
					};
					req.onerror = e => {
						console.timeEnd('storage clear');
						reject(e);
					};
				});
			},
			async gc({name, storeName, data: {expireTime, index}}) {
				index = index || 'updatedAt';
				const {store, transaction} = await this.getStore({name, storeName, mode: 'readwrite'});
				const now = Date.now(), ptime = performance.now();
				const expiresAt = (index !== 'expiresAt') ? (now - expireTime) : now;
				const expireDateTime = new Date(expiresAt).toLocaleString();
				const timekey = `GC [DELETE FROM ${name}.${storeName} WHERE ${index} < '${expireDateTime}'] `;
				console.time(timekey);
				let count = 0;
				return new Promise((resolve, reject) => {
					const range = IDBKeyRange.upperBound(expiresAt);
					const idx = store.index(index);
					const req = idx.openCursor(range);
					req.onsuccess = e => {
						const cursor = e.target.result;
						if (cursor) {
							count++;
							cursor.delete();
							return cursor.continue();
						}
						console.timeEnd(timekey);
						resolve({status: 'ok', count, time: performance.now() - ptime});
						count && console.log('deleted %s records.', count);
					};
					req.onerror = reject;
				}).catch(e => {
					console.error('gc fail', {name, storeName, data: {expireTime, index}, timekey}, e);
					store.clear();
				});
			}
		};
		self.onmessage = async ({command, params}) => {
			try {
			switch (command) {
				case 'init':
					await controller[command](params);
					return 'ok';
				case 'put':
					return controller.put(params);
				case 'updateTime':
				case 'get':
					return controller[command](params);
				default:
					return controller[command](params) || 'ok';
				}
			} catch (err) {
				console.warn('command failed: ', {command, params});
				throw err;
			}
		};
		return controller;
	};
	const workers = new Map;
	const open = async ({name, ver, stores}, func) => {
		let worker;
		if (func) {
			let _func = workerFunc;
			if (func) {
				_func = `
				(() => {
				const controller = (${workerFunc.toString()})(self);
				(${func.toString()})(self)
				})
				`;
			}
			worker = workers.get(func) || workerUtil.createCrossMessageWorker(_func, {name: `IndexedDb[${name}]`});
			workers.set(func, worker);
		} else {
			worker = workers.get(workerFunc) || workerUtil.createCrossMessageWorker(workerFunc, {name: 'IndexedDb'});
			workers.set(workerFunc, worker);
		}
		worker.post({command: 'init', params: {name, ver, stores}});
		const post = (command, data, storeName, transfer) => {
			const params = {data, name, storeName, transfer};
			return worker.post({command, params}, transfer);
		};
		const result = {worker};
		for (const meta of stores) {
			const storeName = meta.name;
			result[storeName] = (storeName => {
				return {
					close: params => post('close', params, storeName),
					put: (record, transfer) => post('put', record, storeName, transfer),
					get: ({key, index, timeout}) => post('get', {key, index, timeout}, storeName),
					updateTime: ({key, index, timeout}) => post('updateTime', {key, index, timeout}, storeName),
					delete: ({key, index, timeout}) => post('delete', {key, index, timeout}, storeName),
					gc: (expireTime = 30 * 24 * 60 * 60 * 1000, index = 'updatedAt') => post('gc', {expireTime, index}, storeName)
				};
			})(storeName);
		}
		return result;
	};
	return {open};
})();
const ThumbInfoCacheDb = (() => {
	const THUMB_INFO = {
		name: 'thumb-info',
		ver: 1,
		stores: [
			{
				name: 'cache',
				indexes: [
					{name: 'postedAt', keyPath: 'postedAt', params: {unique: false}},
					{name: 'updatedAt', keyPath: 'updatedAt', params: {unique: false}}
				],
				definition: {keyPath: 'watchId', autoIncrement: false}
			}
		]
	};
	let db;
	const open = async () => {
		db = db || await IndexedDbStorage.open(THUMB_INFO);
		const cacheDb = db['cache'];
		cacheDb.gc(90 * 24 * 60 * 60 * 1000);
		return {
			put: (xml, thumbInfo = null) => {
				thumbInfo = thumbInfo || parseThumbInfo(xml);
				if (thumbInfo.status !== 'ok') {
					return;
				}
				const watchId = thumbInfo.v;
				const videoId = thumbInfo.id;
				const postedAt = new Date(thumbInfo.postedAt).getTime();
				const updatedAt = Date.now();
				const record = {
					watchId,
					videoId,
					postedAt,
					updatedAt,
					xml,
					thumbInfo
				};
				cacheDb.put(record);
				return {watchId, updatedAt};
			},
			get: watchId => cacheDb.updateTime({key: watchId}),
			delete: watchId => cacheDb.delete({key: watchId}),
			close: () => cacheDb.close()
		};
	};
	return {open};
})();
window.MylistPocketLib = {
  workerUtil
};
const thumbInfoApi = async function() {
const gate = () => {
	const post = function(body, {type, token, sessionId, origin} = {}) {
		sessionId = sessionId || '';
		origin = origin || '';
		this.origin = origin = origin || this.origin || document.referrer;
		this.token = token = token || this.token;
		this.type = type = type || this.type;
		if (!this.channel) {
			this.channel = new MessageChannel;
		}
		const url = location.href;
		const id = PRODUCT;
		try {
			const msg = {id, type, token, url, sessionId, body};
			if (!this.port) {
				msg.body = {command: 'initialized', params: msg.body};
				parent.postMessage(msg, origin, [this.channel.port2]);
				this.port = this.channel.port1;
				this.port.start();
			} else {
				this.port.postMessage(msg);
			}
		} catch (e) {
			console.error('%cError: parent.postMessage - ', 'color: red; background: yellow', e);
		}
		return this.port;
	}.bind({channel: null, port: null, origin: null, token: null, type: null});
	const parseUrl = url => {
		url = url || 'https://unknown.example.com/';
		const a = document.createElement('a');
		a.href = url;
		return a;
	};
	const isNicoServiceHost = url => {
		const host = parseUrl(url).hostname;
		return /(^[a-z0-9.-]*\.nicovideo\.jp$|^[a-z0-9.-]*\.nico(|:[0-9]+)$)/.test(host);
	};
	const isWhiteHost = url => {
		const u = parseUrl(url);
		const host = u.hostname;
		if (['account.nicovideo.jp', 'point.nicovideo.jp'].includes(host)) {
			return false;
		}
		if (isNicoServiceHost(url)) {
			return true;
		}
		if (['localhost', '127.0.0.1'].includes(host)) { return true; }
		if (localStorage.ZenzaWatch_whiteHost) {
			if (localStorage.ZenzaWatch_whiteHost.split(',').includes(host)) {
				return true;
			}
		}
		if (u.protocol !== 'https:') { return false; }
		return [
			'google.com',
			'www.google.com',
			'www.google.co.jp',
			'www.bing.com',
			'twitter.com',
			'friends.nico',
			'feedly.com',
			'www.youtube.com',
		].includes(host) || host.endsWith('.slack.com');
	};
	const uFetch = params => {
		const {url, options}= params;
		if (!isWhiteHost(url) || !isNicoServiceHost(url)) {
			return Promise.reject({status: 'fail', message: 'network error'});
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
		racers.push(fetch(url, options));
		return Promise.race(racers)
			.catch(err => {
			let message = 'uFetch fail';
			if (err && err.name === 'timeout') {
				if (controller) {
					console.warn('request timeout');
					controller.abort();
				}
				message = 'timeout';
			}
			return Promise.reject({status: 'fail', message});
		}).finally(() => { timer && clearTimeout(timer); });
	};
	const xFetch = (params, sessionId = null) => {
		const command = 'fetch';
		return uFetch(params).then(async resp => {
			const buffer = await resp.arrayBuffer();
			const init = ['type', 'url', 'redirected', 'status', 'ok', 'statusText']
					.reduce((map, key) => {map[key] = resp[key]; return map;}, {});
			const headers = [...resp.headers.entries()];
			return Promise.resolve({buffer, init, headers});
		}).then(({buffer, init, headers}) => {
			const result = {status: 'ok', command, params: {buffer, init, headers}};
			post(result, {sessionId});
			return result;
		}).catch(({status, message}) => {
			post({status, message, command}, {sessionId});
		});
	};
	const init = ({prefix, type}) => {
		if (!window.name.startsWith(prefix)) {
			throw new Error(`unknown name "${window.name}"`);
		}
		const PID = `${window && window.name || 'self'}:${location.host}:${name}:${Date.now().toString(16).toUpperCase()}`;
		type = type || window.name.replace(new RegExp(`/(${PRODUCT}|)Loader$/`), '');
		const origin = document.referrer || window.name.split('#')[1];
		console.log('%cCrossDomainPort: host:%s window:%s', 'background: lightgreen;', location.host, window.name.split('#')[0]);
		if (!isWhiteHost(origin)) {
			throw new Error(`disable bridge "${origin}"`);
		}
		const TOKEN = location.hash ? location.hash.substring(1) : null;
		window.history.replaceState(null, null, location.pathname);
		const port = post({status: 'ok', command: 'initialized'}, {type, token: TOKEN, origin});
		workerUtil && workerUtil.env({TOKEN, PRODUCT});
		return {port, TOKEN, origin, type, PID};
	};
	return {post, parseUrl, isNicoServiceHost, isWhiteHost, uFetch, xFetch, init};
};
  const {post, parseUrl, uFetch, init} = gate();
  const {port, TOKEN} = init({prefix: `thumbInfo${PRODUCT}`, type: 'thumbInfo'});
  const db = await ThumbInfoCacheDb.open();
  port.addEventListener('message', async e => {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    const {body, sessionId, token} = data;
    const {command, params} = body;
    if (command !== 'fetch') { return; }
    const p = parseUrl(params.url);
    if (TOKEN !== token ||
      p.hostname !== location.host ||
      !p.pathname.startsWith('/api/getthumbinfo/')) {
      console.log('invalid msg: ', {origin: e.origin, TOKEN, token, body});
      return;
    }
    params.options = params.options || {};

    const watchId = params.url.split('/').reverse()[0];
    const expiresAt = Date.now() - (params.options.expireTime || 0);
    const cache = await db.get(watchId);
    if (cache && cache.thumbInfo.status === 'ok' && cache.updatedAt > expiresAt) {
      return post({status: 'ok', command, params: cache.thumbInfo}, {sessionId});
    }


    delete params.options.credentials;
    return uFetch(params, sessionId)
      .then(res => res.text())
      .then(async xmlText => {
        let thumbInfo = parseThumbInfo(xmlText);
        if (thumbInfo.status === 'ok') {
          db.put(xmlText, thumbInfo);
        } else if (cache && cache.thumbInfo.status === 'ok') {
          thumbInfo = cache.thumbInfo;
        }
        const result = {status: 'ok', command, params: thumbInfo};
        post(result, {sessionId});
      }).catch(({status, message}) => {
        if (cache && cache.thumbInfo.status === 'ok') {
          return post({status: 'ok', command, params: cache.thumbInfo}, {sessionId});
        }
        return post({status, message, command}, {sessionId});
      });
  });
};

  const loadGm = () => {
    const script = document.createElement('script');
    script.id = `${PRODUCT}Loader`;
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('charset', 'UTF-8');
    script.append(`
    (() => {
      const {Handler, PromiseHandler, Emitter} = (${EmitterInitFunc.toString()})();
      ${parseThumbInfo.toString()}

      (${monkey.toString()})("${PRODUCT}");
    })();`);
    (document.head || document.documentElement).append(script);
  };

  const host = window.location.host || '';
  if (host === 'ext.nicovideo.jp' &&
      window.name.indexOf(`thumbInfo${PRODUCT}Loader`) >= 0) {
    thumbInfoApi();
  } else if (window === top) {
    loadGm();
  }
});
