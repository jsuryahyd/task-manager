export function render(Comp, target) {
  let vnode = component(Comp);
  vnode.mount(target);
}

class VComponent {
  constructor(C, props) {
    this.C = C;
    this.instance = null;
    this.props = props;
  }

  mount(parent, afterNode) {
    this.instance = this.C(() => this.patch());
    this.node = this.instance(this.props);
    this.node.mount(parent, afterNode);
  }

  moveBefore(other, afterNode) {
    this.node.moveBefore(other ? other.node : null, afterNode);
  }

  patch(other) {
    this.node.patch(this.instance(other.props));
  }

  beforeRemove() {
    this.node.beforeRemove();
  }

  remove() {
    this.node.remove();
  }

  firstNode() {
    return this.node.firstNode();
  }
}

export function component(C, props) {
  return new VComponent(C, props);
}