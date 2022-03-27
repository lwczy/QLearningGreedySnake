// import type { Scalar } from "@tensorflow/tfjs";
type Scalar = import("@tensorflow/tfjs").Scalar;
//tfjs全局声明
declare interface Window {
  tf: typeof import("@tensorflow/tfjs");
}
const tf: typeof import("@tensorflow/tfjs") = window.tf;
type Tensor2D = import("@tensorflow/tfjs").Tensor2D;

tf.tensor([1, 2, 3]).print();
let weight = tf.randomUniform([12, 4], 0, 1) as Tensor2D;
let bias = tf.randomUniform([1, 4], 0, 1) as Tensor2D;
//x是一组observation向量输入 yhat为 batch*4的矩阵 内容为多条目标值 目标值为每个动作的概率 从0到1
//这里为value*[0,0,1,0]得到 输出为cost值 使用平方差函数
//内部自动对计算得到的y（4个动作的预测value）和yhat（4个动作的观察value)进行activate操作
function activate(d: Tensor2D) {
  return tf.sigmoid(d);
}
function cal(x: Tensor2D, y_hat: Tensor2D, weight: Tensor2D, bias: Tensor2D) {
  //x[batch,12] * w[12,4] ->batch,4+[1,4] yhat:[batch,4]
  return tf
    .sqrt(
      tf
        .pow(
          activate(
            tf.matMul(x, weight).add(bias.broadcastTo([x.shape[0], 4]))
          ).sub(activate(y_hat)),
          2
        )
        .sum()
    )
    .asScalar();
}
var grad = tf.grads(cal);

class RawVirtualTable {
  constructor(public actionSpace: any[]) {}
  data = {};

  nums: Scalar[] = [];
  sum = 0;
  printgap = 1000;
  /**
   * 更新价值
   * @param observ 环境
   * @param action 动作
   * @param real_value 对应的实际价值
   */
  change(observ: number[], action: any, real_value: number): void {
    let obs = JSON.stringify(observ);
    //测试一下tfjs
    let actionid = this.actionSpace.indexOf(action);
    let obj = observ;
    let yhatobj = [0, 0, 0, 0];
    yhatobj[actionid] = 1;
    let [cost, g] = tf.tidy(() => {
      //yhat为类[0,realvalue,0,0] 的数组 变为1*4格式
      let yhat = tf.tensor1d(yhatobj).mul(real_value);
      let pars = [tf.tensor1d(obj).reshape([1, 12]), yhat, weight, bias];
      let cost = cal.apply(null, pars) as import("@tensorflow/tfjs").Scalar;
      let g = grad(pars);
      //输出cost
      return [cost, g];
    });
    //使用g中的weight和bias的梯度修正 weight 和bias 为w=w-gw
    weight = weight.sub(g[2]);
    bias = bias.sub(g[3]);
    //修改
    this.nums.push(cost.clone());
    if (this.nums.length > 10) this.nums.shift().dispose();
    this.sum++;
    //如果是1000的整数倍就输出
    if (this.sum % this.printgap == 0) {
      let avg = tf.tidy(() =>
        this.nums.reduce((p, c) => p.add(c), tf.scalar(0)).div(this.nums.length)
      );
      document.getElementById("cost").innerText = cost.toString();
      document.getElementById("avg").innerText = avg.toString();
      avg.dispose();
    }

    //释放资源
    cost.dispose();
    g.forEach((v) => v.dispose());

    //正常代码
    if (this.data[obs]) this.data[obs][action] = real_value;
    else {
      this.data[obs] = {};
      this.data[obs][action] = real_value;
    }
  }
  /**
   * 求价值
   * @param observ 环境
   * @param action 动作
   * @returns 价值
   */
  predict_value(observ: number[], action: any): number {
    let obs = JSON.stringify(observ);
    if (this.data[obs] && this.data[obs][action]) {
      return this.data[obs][action];
    }
    return 0;
  }

  /**
   *
   * @param ob
   * @returns 最大值的动作 和最大值
   */
  getMaxValueAction(ob: number[]) {
    let obs = JSON.stringify(ob);
    //返回action id
    let max = -Infinity;
    let maxact = "";
    //根本没有遇到过这种情况的话
    if (this.data[obs] == null) {
      let ract =
        this.actionSpace[(Math.random() * this.actionSpace.length) | 0];
      this.data[obs] = Object.fromEntries(
        this.actionSpace.map((v) => [[v], 0])
      );
      //随机采样一个行为
    }
    for (let k in this.data[obs]) {
      const v = this.data[obs][k];
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
