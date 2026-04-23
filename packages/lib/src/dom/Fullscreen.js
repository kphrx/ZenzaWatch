// import * as _ from 'lodash';
// const emitter;
import {global} from '../../../../src/ZenzaWatchIndex';
import {ClassList} from './ClassListWrapper';
//===BEGIN===
const Fullscreen = {
  now() {
    // return matchMedia('(display-mode: fullscreen)').matches;
    if (document.fullScreenElement || document.mozFullScreen || document.webkitIsFullScreen) {
      return true;
    }
    return false;
  },
  get() {
    return document.fullScreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || null;
  },
  request(target) {
    this._handleEvents();
    const elm = typeof target === 'string' ? document.getElementById(target) : target;
    if (!elm) {
      return;
    }
    if (elm.requestFullScreen) {
      elm.requestFullScreen();
    } else if (elm.webkitRequestFullScreen) {
      elm.webkitRequestFullScreen();
    } else if (elm.mozRequestFullScreen) {
      elm.mozRequestFullScreen();
    }
  },
  cancel() {
    if (!this.now()) {
      return;
    }

    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
  },
  _handleEvents() {
    this._handleEvnets = _.noop;
    const cl = ClassList(document.body);
    const handle = (ev) => {
      ev.stopImmediatePropagation();
      const isFull = this.now();
      cl.toggle('is-fullscreen', isFull);
      global.emitter.emit('fullscreenStatusChange', isFull);
    };
    document.addEventListener('webkitfullscreenchange', handle, true);
    document.addEventListener('mozfullscreenchange', handle, true);
    document.addEventListener('MSFullscreenChange', handle, true);
    document.addEventListener('fullscreenchange', handle, true);
  }
};

//===END===

export {Fullscreen};
