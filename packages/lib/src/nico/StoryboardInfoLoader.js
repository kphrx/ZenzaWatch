import {util} from '../../../../src/util';
import {VideoSessionWorker} from './VideoSessionWorker';
//===BEGIN===

const StoryboardInfoLoader = {
  load: (serverType, videoInfo) => {
    if (serverType === 'domand' && videoInfo.hasDomandStoryboard) {
      return VideoSessionWorker.storyboard({type: 'domand', info: videoInfo});
    }
    if (serverType === 'dmc' && videoInfo.hasDmcStoryboard) {
      return VideoSessionWorker.storyboard({type: 'dmc', info: videoInfo});
    }

    return Promise.reject('smile storyboard api not exist');
  }
};


//===END===
//
export {
  StoryboardInfoLoader,
};


