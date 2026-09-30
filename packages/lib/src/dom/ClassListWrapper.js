//===BEGIN===
const ClassList = function(element) {
  if (this.map.has(element)) {
    // self.console.log('ClassListhas cache', element);
    return this.map.get(element);
  }
  const m = element.classList;
  this.map.set(element, m);
  return m;
}.bind({map: new WeakMap()});

//===END===
export {ClassList};
