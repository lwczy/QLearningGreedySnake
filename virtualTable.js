var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const tf = window.tf;
tf.tensor([1, 2, 3]).print();
let weight = tf.randomUniform([12, 4], 0, 1);
let bias = tf.randomUniform([1, 4], 0, 1);
//x是一组observation向量输入 yhat为 batch*4的矩阵 内容为多条目标值 目标值为每个动作的概率 从0到1
//这里为value*[0,0,1,0]得到 输出为cost值 使用平方差函数
//内部自动对计算得到的y（4个动作的预测value）和yhat（4个动作的观察value)进行activate操作
function activate(d) {
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
function cal(x, y_hat, weight, bias) {
    //x[batch,12] * w[12,4] ->batch,4+[1,4] yhat:[batch,4]
    return tf
        .sqrt(tf
        .pow(activate(tf.matMul(x, weight).add(bias.broadcastTo([x.shape[0], 4]))).sub(activate(y_hat)), 2)
        .sum())
        .asScalar();
}
/**
 * cal函数的梯度计算函数 其中 2 3 项为cal输出的cost相对w b矩阵的梯度
 */
var grad = tf.grads(cal);
class RawVirtualTable {
    constructor(actionSpace) {
        this.actionSpace = actionSpace;
        this.data = {};
        this.nums = [];
        this.sum = 0;
        this.printgap = 1000;
        //趋势
        this.qushi = [];
        this.learning_rate = 0.1;
        var chartDom = document.getElementById("qushi");
        this.myChart = echarts.init(chartDom);
    }
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
        };
        //绘图
        this.myChart.setOption(option);
        console.log(this.qushi);
    }
    /**
     * 更新价值
     * @param observ 环境
     * @param action 动作
     * @param real_value 对应的实际价值
     */
    change(observ, action, real_value) {
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
            let cost = cal.apply(null, pars);
            let g = grad(pars);
            //输出cost
            return [cost, g];
        });
        //使用g中的weight和bias的梯度修正 weight 和bias 为w=w-gw
        weight = weight.sub(tf.tidy(() => g[2].mul(this.learning_rate)));
        bias = bias.sub(tf.tidy(() => g[3].mul(this.learning_rate)));
        //修改
        this.nums.push(cost.clone());
        if (this.nums.length > 10)
            this.nums.shift().dispose();
        //sum这里记录的是学习次数不是轮数
        this.sum++;
        //如果是1000的整数倍就输出
        if (this.sum % this.printgap == 0) {
            let avg = tf
                .tidy(() => this.nums
                .reduce((p, c) => p.add(c), tf.scalar(0))
                .div(this.nums.length))
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
        if (this.data[obs])
            this.data[obs][action] = real_value;
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
    predict_value(observ, action) {
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
    getMaxValueAction(ob) {
        let obs = JSON.stringify(ob);
        //返回action id
        let max = -Infinity;
        let maxact = "";
        //根本没有遇到过这种情况的话
        if (this.data[obs] == null) {
            let ract = this.actionSpace[(Math.random() * this.actionSpace.length) | 0];
            this.data[obs] = Object.fromEntries(this.actionSpace.map((v) => [[v], 0]));
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
    store() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Blob([JSON.stringify(this.data)]);
        });
    }
    load(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = JSON.parse(yield data.text());
        });
    }
}
class MathVirtualTable {
    store() {
        throw new Error("Method not implemented.");
    }
    change(observ, action, real_value) {
        throw new Error("Method not implemented.");
    }
    predict_value(observ, action) {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbFRhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmlydHVhbFRhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU1BLE1BQU0sRUFBRSxHQUFzQyxNQUFNLENBQUMsRUFBRSxDQUFDO0FBR3hELEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFhLENBQUM7QUFDekQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFhLENBQUM7QUFDdEQsZ0VBQWdFO0FBQ2hFLHVDQUF1QztBQUN2QywwREFBMEQ7QUFDMUQsU0FBUyxRQUFRLENBQUMsQ0FBVztJQUMzQixPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUNEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxHQUFHLENBQUMsQ0FBVyxFQUFFLEtBQWUsRUFBRSxNQUFnQixFQUFFLElBQWM7SUFDekUsc0RBQXNEO0lBQ3RELE9BQU8sRUFBRTtTQUNOLElBQUksQ0FDSCxFQUFFO1NBQ0MsR0FBRyxDQUNGLFFBQVEsQ0FDTixFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM1RCxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDdEIsQ0FBQyxDQUNG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