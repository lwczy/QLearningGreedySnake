//tfjs全局声明
declare interface Window {
  tf: typeof import("@tensorflow/tfjs");
}
const tf = window.tf;
tf.tensor([1, 2, 3]).print();
class RawVirtualTable {
  constructor(public actionSpace: any[]) {}
  data = {};
  /**
   * 更新价值
   * @param observ 环境
   * @param action 动作
   * @param real_value 对应的实际价值
   */
  change(observ: number, action: any, real_value: number): void {
    if (this.data[observ]) this.data[observ][action] = real_value;
    else {
      this.data[observ] = {};
      this.data[observ][action] = real_value;
    }
  }
  /**
   * 求价值
   * @param observ 环境
   * @param action 动作
   * @returns 价值
   */
  predict_value(observ: number, action: any): number {
    if (this.data[observ] && this.data[observ][action]) {
      return this.data[observ][action];
    }
    return 0;
  }

  /**
   *
   * @param ob
   * @returns 最大值的动作 和最大值
   */
  getMaxValueAction(ob: number) {
    //返回action id
    let max = -Infinity;
    let maxact = "";
    //根本没有遇到过这种情况的话
    if (this.data[ob] == null) {
      let ract =
        this.actionSpace[(Math.random() * this.actionSpace.length) | 0];
      this.data[ob] = { [ract]: 0 };
      //随机采样一个行为
    }
    for (let k in this.data[ob]) {
      const v = this.data[ob][k];
      if (max < v) {
        maxact = k;
        max = v;
      }
    }
    return [maxact, max];
  }
  /**
   * 获取可存储的二进制对象
   */
  async store() {
    return new Blob([JSON.stringify(this.data)]);
  }
  async load(data: Blob) {
    this.data = JSON.parse(await data.text());
  }
}
interface VirtualTable extends RawVirtualTable {}

class MathVirtualTable implements VirtualTable {
  store() {
    throw new Error("Method not implemented.");
  }
  data: {};
  change(observ: number, action: number, real_value: number): void {
    throw new Error("Method not implemented.");
  }
  predict_value(observ: number, action: number): number {
    throw new Error("Method not implemented.");
  }
}

const test = new RawVirtualTable();
test.change(1, 2, 3);
console.log(test.predict_value(1, 2));
