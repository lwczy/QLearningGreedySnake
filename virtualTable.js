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
function cal(x, y_hat, weight, bias) {
    //x[batch,12] * w[12,4] ->batch,4+[1,4] yhat:[batch,4]
    return tf
        .sqrt(tf
        .pow(activate(tf.matMul(x, weight).add(bias.broadcastTo([x.shape[0], 4]))).sub(activate(y_hat)), 2)
        .sum())
        .asScalar();
}
var grad = tf.grads(cal);
class RawVirtualTable {
    constructor(actionSpace) {
        this.actionSpace = actionSpace;
        this.data = {};
        this.nums = [];
        this.sum = 0;
        this.printgap = 1000;
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
        weight = weight.sub(g[2]);
        bias = bias.sub(g[3]);
        //修改
        this.nums.push(cost.clone());
        if (this.nums.length > 10)
            this.nums.shift().dispose();
        this.sum++;
        //如果是1000的整数倍就输出
        if (this.sum % this.printgap == 0) {
            let avg = tf.tidy(() => this.nums.reduce((p, c) => p.add(c), tf.scalar(0)).div(this.nums.length));
            document.getElementById("cost").innerText = cost.toString();
            document.getElementById("avg").innerText = avg.toString();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbFRhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmlydHVhbFRhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU1BLE1BQU0sRUFBRSxHQUFzQyxNQUFNLENBQUMsRUFBRSxDQUFDO0FBR3hELEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFhLENBQUM7QUFDekQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFhLENBQUM7QUFDdEQsZ0VBQWdFO0FBQ2hFLHVDQUF1QztBQUN2QywwREFBMEQ7QUFDMUQsU0FBUyxRQUFRLENBQUMsQ0FBVztJQUMzQixPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUNELFNBQVMsR0FBRyxDQUFDLENBQVcsRUFBRSxLQUFlLEVBQUUsTUFBZ0IsRUFBRSxJQUFjO0lBQ3pFLHNEQUFzRDtJQUN0RCxPQUFPLEVBQUU7U0FDTixJQUFJLENBQ0gsRUFBRTtTQUNDLEdBQUcsQ0FDRixRQUFRLENBQ04sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDNUQsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQ3RCLENBQUMsQ0FDRjtTQUNBLEdBQUcsRUFBRSxD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