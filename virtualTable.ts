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
/**
 *  本函数用于根据输入环境预测采取每个动作的预测奖励 输出为 1*4数组
 * 输入yhat为真实的每个动作的奖励 根据realvalue生成 输出为两者两者差异值
 * @param x 观察值 observation 数组
 * @param y_hat 真实的q值分布（对应到每个动作）
 * @param weight  weight参数
 * @param bias
 * @returns  cost值
 */
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
/**
 * cal函数的梯度计算函数 其中 2 3 项为cal输出的cost相对w b矩阵的梯度
 */
var grad = tf.grads(cal);

class RawVirtualTable {
  constructor(public actionSpace: any[]) {
    var chartDom = document.getElementById("qushi") as HTMLDivElement;
    this.myChart = echarts.init(chartDom);
  }
  myChart;
  data = {};

  nums: Scalar[] = [];
  sum = 0;
  printgap = 1000;
  //趋势
  qushi = [] as number[];
  paint() {
    var option = {
      xAxis: {
        type: "category",
        data: this.qushi.map((_, idx) => idx),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: this.qushi,
          type: "line",
        },
      ],
    } as import("echarts").EChartOption;
    //绘图
    this.myChart.setOption(option);
    console.log(this.qushi);
  }
  learning_rate = 0.1;
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
    weight = weight.sub(tf.tidy(() => g[2].mul(this.learning_rate)));
    bias = bias.sub(tf.tidy(() => g[3].mul(this.learning_rate)));
    //修改
    this.nums.push(cost.clone());
    if (this.nums.length > 10) this.nums.shift().dispose();
    //sum这里记录的是学习次数不是轮数
    this.sum++;
    //如果是1000的整数倍就输出
    if (this.sum % this.printgap == 0) {
      let avg = tf
        .tidy(() =>
          this.nums
            .reduce((p, c) => p.add(c), tf.scalar(0))
            .div(this.nums.length)
        )
        .asScalar();
      const gradc = tf.tidy(() => g[2].abs().sum().toString());
      document.getElementById("cost").innerText = cost.toString();
      document.getElementById("avg").innerText = avg.toString();
      document.getElementById("grad").innerText = gradc;
      this.qushi.push(avg.arraySync());
      this.paint();
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
