import {Emitter} from '../../../lib/src/Emitter';
import {textUtil} from '../../../lib/src/text/textUtil';
import {Config} from '../../../../src/Config';

//===BEGIN===
class NicoChatFilter extends Emitter {
  constructor(params) {
    super();
    this._sharedNgLevel = params.sharedNgLevel || NicoChatFilter.SHARED_NG_LEVEL.MID;
    this._removeNgMatchedUser = params.removeNgMatchedUser || false;

    this._wordFilterList = [];
    this._userIdFilterList = [];
    this._commandFilterList = [];
    this.wordFilterList = params.wordFilter || '';
    this.userIdFilterList = params.userIdFilter || '';
    this.commandFilterList = params.commandFilter || '';

    this._fork0 = typeof params.fork0 === 'boolean' ? params.fork0 : true;
    this._fork1 = typeof params.fork1 === 'boolean' ? params.fork1 : true;
    this._fork2 = typeof params.fork2 === 'boolean' ? params.fork2 : true;
    this._fork3 = typeof params.fork3 === 'boolean' ? params.fork3 : true;

    this._defaultThread = typeof params.defaultThread === 'boolean' ? params.defaultThread : true;
    this._ownerThread = typeof params.ownerThread === 'boolean' ? params.ownerThread : true;
    this._communityThread = typeof params.communityThread === 'boolean' ? params.communityThread : true;
    this._nicosThread = typeof params.nicosThread === 'boolean' ? params.nicosThread : true;
    this._easyThread = typeof params.easyThread === 'boolean' ? params.easyThread : true;
    this._aiThread = typeof params.aiThread === 'boolean' ? params.aiThread : true;
    this._extraDefaultThread = typeof params.extraDefaultThread === 'boolean' ? params.extraDefaultThread : true;
    this._extraOwnerThread = typeof params.extraOwnerThread === 'boolean' ? params.extraOwnerThread : true;
    this._extraCommunityThread = typeof params.extraCommunityThread === 'boolean' ? params.extraCommunityThread : true;
    this._extraNicosThread = typeof params.extraNicosThread === 'boolean' ? params.extraNicosThread : true;
    this._extraEasyThread = typeof params.extraEasyThread === 'boolean' ? params.extraEasyThread : true;

    this._enable = typeof params.enableFilter === 'boolean' ? params.enableFilter : true;

    this._wordReg = null;
    this._wordRegReg = null;
    this._userIdReg = null;
    this._commandReg = null;

    this._onChange = _.debounce(this._onChange.bind(this), 50);

    if (params.wordRegFilter) {
      this.setWordRegFilter(params.wordRegFilter, params.wordRegFilterFlags);
    }
  }
  get isEnable() {
    return this._enable;
  }
  set isEnable(v) {
    if (this._enable === v) {
      return;
    }
    this._enable = !!v;
    this._onChange();
  }
  get removeNgMatchedUser() {
    return this._removeNgMatchedUser;
  }
  set removeNgMatchedUser(v) {
    if (this._removeNgMatchedUser === v) {
      return;
    }
    this._removeNgMatchedUser = !!v;
    this.refresh();
  }
  get fork0() { return this._fork0; }
  set fork0(v) {
    v = !!v;
    if (this._fork0 === v) { return; }
    this._fork0 = v;
    this.refresh();
  }
  get fork1() { return this._fork1; }
  set fork1(v) {
    v = !!v;
    if (this._fork1 === v) { return; }
    this._fork1 = v;
    this.refresh();
  }
  get fork2() { return this._fork2; }
  set fork2(v) {
    v = !!v;
    if (this._fork2 === v) { return; }
    this._fork2 = v;
    this.refresh();
  }
  get fork3() { return this._fork3; }
  set fork3(v) {
    v = !!v;
    if (this._fork3 === v) { return; }
    this._fork3 = v;
    this.refresh();
  }
  get defaultThread() { return this._defaultThread; }
  set defaultThread(v) {
    v = !!v;
    if (this._defaultThread === v) { return; }
    this._defaultThread = v;
    this.refresh();
  }
  get ownerThread() { return this._ownerThread; }
  set ownerThread(v) {
    v = !!v;
    if (this._ownerThread === v) { return; }
    this._ownerThread = v;
    this.refresh();
  }
  get communityThread() { return this._communityThread; }
  set communityThread(v) {
    v = !!v;
    if (this._communityThread === v) { return; }
    this._communityThread = v;
    this.refresh();
  }
  get nicosThread() { return this._nicosThread; }
  set nicosThread(v) {
    v = !!v;
    if (this._nicosThread === v) { return; }
    this._nicosThread = v;
    this.refresh();
  }
  get easyThread() { return this._easyThread; }
  set easyThread(v) {
    v = !!v;
    if (this._easyThread === v) { return; }
    this._easyThread = v;
    this.refresh();
  }
  get aiThread() { return this._aiThread; }
  set aiThread(v) {
    v = !!v;
    if (this._aiThread === v) { return; }
    this._aiThread = v;
    this.refresh();
  }
  get extraDefaultThread() { return this._extraDefaultThread; }
  set extraDefaultThread(v) {
    v = !!v;
    if (this._extraDefaultThread === v) { return; }
    this._extraDefaultThread = v;
    this.refresh();
  }
  get extraOwnerThread() { return this._extraOwnerThread; }
  set extraOwnerThread(v) {
    v = !!v;
    if (this._extraOwnerThread === v) { return; }
    this._extraOwnerThread = v;
    this.refresh();
  }
  get extraCommunityThread() { return this._extraCommunityThread; }
  set extraCommunityThread(v) {
    v = !!v;
    if (this._extraCommunityThread === v) { return; }
    this._extraCommunityThread = v;
    this.refresh();
  }
  get extraNicosThread() { return this._extraNicosThread; }
  set extraNicosThread(v) {
    v = !!v;
    if (this._extraNicosThread === v) { return; }
    this._extraNicosThread = v;
    this.refresh();
  }
  get extraEasyThread() { return this._extraEasyThread; }
  set extraEasyThread(v) {
    v = !!v;
    if (this._extraEasyThread === v) { return; }
    this._extraEasyThread = v;
    this.refresh();
  }
  refresh() { this._onChange(); }
  addWordFilter(text) {
    let before = this._wordFilterList.join('\n');
    this._wordFilterList.push((text || '').trim());
    this._wordFilterList = [...new Set(this._wordFilterList)];
    let after = this._wordFilterList.join('\n');
    if (before === after) { return; }
    this._wordReg = null;
    this._onChange();
  }
  set wordFilterList(list) {
    list = [...new Set(typeof list === 'string' ? list.trim().split('\n') : list)];

    let before = this._wordFilterList.join('\n');
    let tmp = [];
    list.forEach(text => {
      if (!text) { return; }
      tmp.push(text.trim());
    });
    tmp = _.compact(tmp);
    let after = tmp.join('\n');

    if (before === after) { return; }
    this._wordReg = null;
    this._wordFilterList = tmp;
    this._onChange();
  }
  get wordFilterList() {
    return this._wordFilterList;
  }

  setWordRegFilter(source, flags) {
    if (this._wordRegReg) {
      if (this._wordRegReg.source === source && this._flags === flags) {
        return;
      }
    }
    try {
      this._wordRegReg = new RegExp(source, flags);
    } catch (e) {
      window.console.error(e);
      return;
    }
    this._onChange();
  }

  addUserIdFilter(text) {
    const before = this._userIdFilterList.join('\n');
    this._userIdFilterList.push(text);
    this._userIdFilterList = [...new Set(this._userIdFilterList)];
    const after = this._userIdFilterList.join('\n');
    if (before === after) { return; }
    this._userIdReg = null;
    this._onChange();
  }
  set userIdFilterList(list) {
    list = [...new Set(typeof list === 'string' ? list.trim().split('\n') : list)];

    let before = this._userIdFilterList.join('\n');
    let tmp = [];
    list.forEach(text => {
      if (!text) { return; }
      tmp.push(text.trim());
    });
    tmp = _.compact(tmp);
    let after = tmp.join('\n');

    if (before === after) { return; }
    this._userIdReg = null;
    this._userIdFilterList = tmp;
    this._onChange();
  }
  get userIdFilterList() {
    return this._userIdFilterList;
  }
  addCommandFilter(text) {
    let before = this._commandFilterList.join('\n');
    this._commandFilterList.push(text);
    this._commandFilterList = [...new Set(this._commandFilterList)];
    let after = this._commandFilterList.join('\n');
    if (before === after) { return; }
    this._commandReg = null;
    this._onChange();
  }
  set commandFilterList(list) {
    list = [...new Set(typeof list === 'string' ? list.trim().split('\n') : list)];

    let before = this._commandFilterList.join('\n');
    let tmp = [];
    list.forEach(text => {
      if (!text) { return; }
      tmp.push(text.trim());
    });
    tmp = _.compact(tmp);
    let after = tmp.join('\n');

    if (before === after) { return; }
    this._commandReg = null;
    this._commandFilterList = tmp;
    this._onChange();
  }
  get commandFilterList() {
    return this._commandFilterList;
  }

  set sharedNgLevel(level) {
    if (NicoChatFilter.SHARED_NG_LEVEL[level] && this._sharedNgLevel !== level) {
      this._sharedNgLevel = level;
      this._onChange();
    }
  }
  get sharedNgLevel() {
    return this._sharedNgLevel;
  }
  getFilterFunc() {
    if (!this._enable) {
      return () => true;
    }
    const threthold = NicoChatFilter.SHARED_NG_SCORE[this._sharedNgLevel];

    // NG設定の数×コメント数だけループを回すのはアホらしいので、
    // 連結した一個の正規表現を生成する
    if (!this._wordReg) {
      this._wordReg = this._buildFilterReg(this._wordFilterList);
    }
    const umatch = this._userIdFilterList.length ? this._userIdFilterList : null;
    if (!this._commandReg) {
      this._commandReg = this._buildFilterReg(this._commandFilterList);
    }
    const wordReg = this._wordReg;
    const wordRegReg = this._wordRegReg;
    const commandReg = this._commandReg;

    if (Config.getValue('debug')) {
      return nicoChat => {
        if (nicoChat.fork === 1) {
          return true;
        }
        const score = nicoChat.score;
        if (score <= threthold) {
          window.console.log('%cNG共有適用: %s <= %s %s %s秒 %s', 'background: yellow;',
            score,
            threthold,
            nicoChat.type,
            nicoChat.vpos / 100,
            nicoChat.text
          );
          return false;
        }
        let m;
        wordReg && (m = wordReg.exec(nicoChat.text));
        if (m) {
          window.console.log('%cNGワード: "%s" %s %s秒 %s', 'background: yellow;',
            m[1],
            nicoChat.type,
            nicoChat.vpos / 100,
            nicoChat.text
          );
          return false;
        }

        wordRegReg && (m = wordRegReg.exec(nicoChat.text));
        if (m) {
          window.console.log(
            '%cNGワード(正規表現): "%s" %s %s秒 %s',
            'background: yellow;',
            m[1],
            nicoChat.type,
            nicoChat.vpos / 100,
            nicoChat.text
          );
          return false;
        }

        if (umatch && umatch.includes(nicoChat.userId)) {
          window.console.log('%cNGID: "%s" %s %s秒 %s %s', 'background: yellow;',
            nicoChat.userId,
            nicoChat.type,
            nicoChat.vpos / 100,
            nicoChat.userId,
            nicoChat.text
          );
          return false;
        }
        commandReg && (m = commandReg.test(nicoChat.cmd));
        if (m) {
          window.console.log('%cNG command: "%s" %s %s秒 %s %s', 'background: yellow;',
            m[1],
            nicoChat.type,
            nicoChat.vpos / 100,
            nicoChat.cmd,
            nicoChat.text
          );
          return false;
        }

        return true;
      };
    }

    return nicoChat => {
      if (nicoChat.fork === 1) { //fork1 投稿者コメントはNGしない
        return true;
      }
      const text = nicoChat.text;
      return !(
        (nicoChat.score <= threthold) ||
        (wordReg && wordReg.test(text)) ||
        (wordRegReg && wordRegReg.test(text)) ||
        (umatch && umatch.includes(nicoChat.userId)) ||
        (commandReg && commandReg.test(nicoChat.cmd))
        );
    };
  }
  applyFilter(nicoChatArray) {
    const before = nicoChatArray.length;
    if (before < 1) {
      return nicoChatArray;
    }
    const timeKey = 'applyNgFilter: ' + nicoChatArray[0].type;
    window.console.time(timeKey);
    const filterFunc = this.getFilterFunc();
    let result = nicoChatArray.filter(filterFunc);
    const removedUserIds = (before !== result.length && this._removeNgMatchedUser)
      ? nicoChatArray.filter(chat => !result.includes(chat)).map(chat => chat.userId)
      : [];
    const denyTypes = [
      !this.fork0 && 0,
      !this.fork1 && 1,
      !this.fork2 && 2,
      !this.fork3 && 3,
    ].filter(type => type !== false);
    const denyThreadTypes = [
      !this.defaultThread        && 'default',
      !this.ownerThread          && 'owner',
      !this.communityThread      && 'community',
      !this.nicosThread          && 'nicos',
      !this.easyThread           && 'easy',
      !this.aiThread             && 'ai',
      !this.extraDefaultThread   && 'extra-default',
      !this.extraOwnerThread     && 'extra-owner',
      !this.extraCommunityThread && 'extra-community',
      !this.extraNicosThread     && 'extra-nicos',
      !this.extraEasyThread      && 'extra-easy',
    ].filter(type => type !== false);
    result = result.filter(chat => {
      if (removedUserIds.length > 0 && removedUserIds.includes(chat.userId)) {
        return false;
      }
      return !denyTypes.includes(chat.fork) && !denyThreadTypes.includes(chat.threadLabel);
    });
    window.console.timeEnd(timeKey);
    window.console.log('NG判定結果: %s/%s', result.length, before);
    return result;
  }
  isSafe(nicoChat) {
    return (this.getFilterFunc())(nicoChat);
  }
  _buildFilterReg(filterList) {
    if (filterList.length < 1) {
      return null;
    }
    const escapeRegs = textUtil.escapeRegs;
    let r = filterList.filter(f => f).map(f => escapeRegs(f));
    return new RegExp('(' + r.join('|') + ')', 'i');
  }
  _buildFilterPerfectMatchinghReg(filterList) {
    if (filterList.length < 1) {
      return null;
    }
    const escapeRegs = textUtil.escapeRegs;
    let r = filterList.filter(f => f).map(f => escapeRegs(f));
    return new RegExp('^(' + r.join('|') + ')$');
  }
  _onChange() {
    console.log('NicoChatFilter.onChange');
    this.emit('change');
  }
}

NicoChatFilter.SHARED_NG_LEVEL = {
  NONE: 'NONE',
  LOW: 'LOW',
  MID: 'MID',
  HIGH: 'HIGH',
  MAX: 'MAX'
};
NicoChatFilter.SHARED_NG_SCORE = {
  NONE: -99999,//Number.MIN_VALUE,
  LOW: -10000,
  MID: -5000,
  HIGH: -1000,
  MAX: -1
};

//===END===
export {NicoChatFilter};

// return nicoChat => {
//   if (nicoChat.fork > 0) {
//     return true;
//   }

//   if (nicoChat.score <= threthold) {
//     return false;
//   }

//   if (wordReg && wordReg.test(nicoChat.text)) {
//     return false;
//   }

//   if (wordRegReg && wordRegReg.test(nicoChat.text)) {
//     return false;
//   }

//   if (userIdReg && userIdReg.test(nicoChat.text)) {
//     return false;
//   }

//   if (commandReg && commandReg.test(nicoChat.cmd)) {
//     return false;
//   }

//   return true;
// };
// }
