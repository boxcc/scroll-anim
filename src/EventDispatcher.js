import { dataToArray } from './util';
function EventDispatcher(target) {
  this._listeners = {};
  this._eventTarget = target || {};
  this.recoverLists = [];
  this._listFun = {};
}
EventDispatcher.prototype = {
  addEventListener(type, callback, target) {
    const types = type.split('.');
    const _type = types[0];
    const namespaces = types[1];
    const listName = `${_type}${target ? target.getAttribute('id') : ''}`;
    let list = this._listeners[listName];
    let index = 0;
    let listener;
    let i;
    if (!list) {
      this._listeners[listName] = list = [];
    }
    i = list.length;

    while (--i > -1) {
      listener = list[i];
      if (listener.n === namespaces && listener.c === callback) {
        list.splice(i, 1);
      } else if (index === 0) {
        index = i + 1;
      }
    }

    list.splice(index, 0, { c: callback, n: namespaces, t: _type });
    if (!this._listFun[listName]) {
      this._listFun[listName] = this._listFun[listName] || this.dispatchEvent.bind(this, _type, target);
      if (this._eventTarget.addEventListener) {
        (target || this._eventTarget).addEventListener(_type, this._listFun[listName], false);
      } else if (this._eventTarget.attachEvent) {
        (target || this._eventTarget).attachEvent(`on${_type}`, this._listFun[listName]);
      }
    }
  },

  removeEventListener(type, callback, target, force) {
    const types = type.split('.');
    const _type = types[0];
    const namespaces = types[1];
    const listName = `${_type}${target ? target.getAttribute('id') : ''}`;
    const list = this._listeners[listName];
    let i;
    let _force = force;
    if (!namespaces) {
      _force = true;
    }
    if (list) {
      i = list.length;
      while (--i > -1) {
        if (list[i].c === callback && (_force || list[i].n === namespaces)) {
          list.splice(i, 1);
          if (!list.length) {
            const func = this._listFun[listName];
            delete this._listeners[listName];
            delete this._listFun[listName];
            if (this._eventTarget.removeEventListener) {
              (target || this._eventTarget).removeEventListener(_type, func);
            } else if (this._eventTarget.detachEvent) {
              (target || this._eventTarget).detachEvent(`on${_type}`, func);
            }
          }
          if (!_force) {
            return;
          }
        }
      }
    }
  },

  dispatchEvent(type, target, e) {
    const listName = `${type}${target ? target.getAttribute('id') : ''}`;
    const list = this._listeners[listName];
    let i;
    let t;
    let listener;
    if (list) {
      i = list.length;
      t = this._eventTarget;
      while (--i > -1) {
        listener = list[i];
        if (listener) {
          const _e = e || { type, target: t };
          listener.c.call(t, _e);
        }
      }
    }
  },
  removeAllType(type, target) {
    const types = type.split('.');
    const _type = types[0];
    const namespaces = types[1];
    const listName = `${type}${target ? target.getAttribute('id') : ''}`;
    const list = this._listeners[listName];
    this.recoverLists = this.recoverLists.concat(dataToArray(list).filter(item =>
      item.n && item.n.match(namespaces)
    ));
    this.recoverLists.forEach(item => {
      this.removeEventListener(`${item.t}.${item.n}`, item.c, target);
    });
  },
  reAllType(type, target) {
    const types = type.split('.');
    const _type = types[0];
    const namespaces = types[1];
    this.recoverLists = this.recoverLists.map(item => {
      if (item.t === _type && item.n.match(namespaces)) {
        this.addEventListener(`${item.t}.${item.n}`, item.c, target);
        return null;
      }
      return item;
    }).filter(item => item);
  },
};
let event;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  event = new EventDispatcher(window);
} else {
  event = new EventDispatcher();
}
export default event;
