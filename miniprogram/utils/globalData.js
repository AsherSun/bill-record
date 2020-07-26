const keyMaps = ['userInfo', 'hasEdit'];
const globalData = {
  callFns: {},
  data: {},
  $on(key, fn) {
    if (this.callFns[key] instanceof Function) {
      this.callFns[key](fn);
    } else {
      this.callFns[key] = (...rest) => {
        fn && fn(...rest);
      }
    }
  },
  $emit(key, ...rest) {
    if (this.callFns[key] instanceof Function) {
      this.callFns[key](...rest);
    } else {
      this.callFns[key] = (fn) => {
        fn && fn(...rest);
      }
    }
  }
};
keyMaps.forEach(key => {
  Object.defineProperty(globalData, key, {
    get () {
      this.callFns[key] = void 0;
      return this.data[key];
    },
    set(value) {
      this.data[key] = value;
      this.$emit(key, value);
    },
  });
})

export default globalData;