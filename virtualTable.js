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
class RawVirtualTable {
    constructor(actionSpace) {
        this.actionSpace = actionSpace;
        this.data = {};
    }
    /**
     * 更新价值
     * @param observ 环境
     * @param action 动作
     * @param real_value 对应的实际价值
     */
    change(observ, action, real_value) {
        if (this.data[observ])
            this.data[observ][action] = real_value;
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
    predict_value(observ, action) {
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
    getMaxValueAction(ob) {
        //返回action id
        let max = -Infinity;
        let maxact = "";
        //根本没有遇到过这种情况的话
        if (this.data[ob] == null) {
            let ract = this.actionSpace[(Math.random() * this.actionSpace.length) | 0];
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
const test = new RawVirtualTable();
test.change(1, 2, 3);
console.log(test.predict_value(1, 2));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbFRhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmlydHVhbFRhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUlBLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDckIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUM3QixNQUFNLGVBQWU7SUFDbkIsWUFBbUIsV0FBa0I7UUFBbEIsZ0JBQVcsR0FBWCxXQUFXLENBQU87UUFDckMsU0FBSSxHQUFHLEVBQUUsQ0FBQztJQUQ4QixDQUFDO0lBRXpDOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLE1BQWMsRUFBRSxNQUFXLEVBQUUsVUFBa0I7UUFDcEQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDO2FBQ3pEO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUM7U0FDeEM7SUFDSCxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDSCxhQUFhLENBQUMsTUFBYyxFQUFFLE1BQVc7UUFDdkMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGlCQUFpQixDQUFDLEVBQVU7UUFDMUIsYUFBYTtRQUNiLElBQUksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQ3BCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixlQUFlO1FBQ2YsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUN6QixJQUFJLElBQUksR0FDTixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDOUIsVUFBVTtTQUNYO1FBQ0QsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ1gsR0FBRyxHQUFHLENBQUMsQ0FBQzthQUNUO1NBQ0Y7UUFDRCxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFDRDs7T0FFRztJQUNHLEtBQUs7O1lBQ1QsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQUE7SUFDSyxJQUFJLENBQUMsSUFBVTs7WUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDNUMsQ0FBQztLQUFBO0NBQ0Y7QUFHRCxNQUFNLGdCQUFnQjtJQUNwQixLQUFLO1FBQ0gsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxNQUFNLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxVQUFrQjtRQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNELGFBQWEsQ0FBQyxNQUFjLEVBQUUsTUFBYztRQUMxQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztBQUNuQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDIn0=