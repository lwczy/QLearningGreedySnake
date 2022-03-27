/**
 * 环境
 */
class Env {
  constructor(ctx, width, height, size) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.size = size;

    this.w = width / size;
    this.h = height / size;
  }

  getRandomXY() {
    return [(Math.random() * this.w) | 0, (Math.random() * this.h) | 0];
  }

  XY2Index(x, y) {
    return y * this.w + x;
  }

  Index2XY(index) {
    return [index % this.w, (index / this.w) | 0];
  }

  newFood() {
    const list = [];
    this.consume = 0;
    for (let i = 0; i < this.w; i++) {
      for (let j = 0; j < this.h; j++) {
        if (this.data[i][j] === -1) {
          list.push([i, j]);
        }
      }
    }
    if (list.length === 0) {
      this.food = null;
      return false;
    }
    const [x, y] = list[Math.floor(Math.random() * list.length)];
    this.data[x][y] = -3;
    this.food = [x, y];
    return true;
  }

  newSnake() {
    // clear old snake
    const [x, y] = this.getRandomXY();
    this.data[x][y] = this.XY2Index(x, y);
    this.snake_start = [x, y];
    this.snake_end = [x, y];
    this.snake_len = 1;
  }

  get colors() {
    return {
      " ": "white",
      "#": "black",
      o: "green",
      "*": "gray",
      "@": "blue",
    };
  }

  get renderData() {
    const data = this.data.map((col) =>
      col.map((data) => {
        switch (data) {
          case -1:
            return " ";
          case -2:
            return "#";
          case -3:
            return "o";
          default:
            return "*";
        }
      })
    );
    const [x, y] = this.snake_start;
    data[x][y] = "@";
    return data;
  }

  // get food(){
  //   for(let i = 0; i < this.w; i++)
  //     for(let j = 0; j < this.h; j++)
  //       if(this.isFood(i, j))
  //         return [i, j];
  // }

  /**
   * 返回环境的hash值
   * @type {numbe[]}
   */
  async getObservation() {
    const [snakeX, snakeY] = this.snake_start;
    const [endX, endY] = this.snake_end;
    const foodPos = this.food;
    if (!foodPos) return "over";
    const [foodX, foodY] = foodPos;

    const allAround = [
      this.getSpaces(snakeX, snakeY, (x, y) => [x, y - 1]),
      this.getSpaces(snakeX, snakeY, (x, y) => [x, y + 1]),
      this.getSpaces(snakeX, snakeY, (x, y) => [x - 1, y]),
      this.getSpaces(snakeX, snakeY, (x, y) => [x + 1, y]),
      this.isWall(snakeX - 1, snakeY - 1) | 0,
      this.isWall(snakeX + 1, snakeY - 1) | 0,
      this.isWall(snakeX + 1, snakeY + 1) | 0,
      this.isWall(snakeX - 1, snakeY + 1) | 0,
    ];
    //直接把环境的描述转为string后求hash作为观察值
    //观察值 表示食物到头部距离和头部到尾部距离 以及头部周围格子的状态
    const ob = [
      [foodX - snakeX, foodY - snakeY],
      [endX - snakeX, endY - snakeY],
      allAround,
    ];
    //观察向量
    const obr = allAround.concat(ob[0], ob[1]);
    // console.log(obr);
    // return b64_md5(JSON.stringify(ob));

    return obr;
    async function cirtonum() {
      let v = new Blob([b64_md5(JSON.stringify(ob))]);
      let ar = await v.arrayBuffer();
      return new Uint8Array(ar).reduce((pre, curr) => {
        return pre + curr;
      }, 0);
    }
  }

  getSpaces(x, y, next) {
    let i = 0;
    [x, y] = next(x, y);
    for (; !this.isWall(x, y); i++) {
      [x, y] = next(x, y);
    }
    return i;
  }

  isFood(x, y) {
    return this.data[x][y] === -3;
  }

  isWall(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    if (this.data[x][y] === -2) return true;
    if (this.data[x][y] >= 0) return true;
    return false;
  }

  render() {
    const ctx = this.ctx;
    const data = this.renderData;
    const color = this.colors;
    ctx.clearRect(0, 0, this.width, this.height);
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        ctx.fillStyle = color[data[x][y]];
        ctx.fillRect(x * this.size, y * this.size, this.size, this.size);
      }
    }
  }

  async reset() {
    this.data = [];
    for (let i = 0; i < this.width / this.size; i++) {
      const col = [];
      for (let j = 0; j < this.height / this.size; j++) col.push(-1);
      this.data.push(col);
    }

    this.newSnake();
    this.newFood();

    return await this.getObservation();
  }

  get actions() {
    return ["l", "r", "u", "d"];
  }

  async step(action) {
    const [x, y] = this.snake_start;
    let newX = x,
      newY = y;

    this.consume++;

    switch (action) {
      case "l":
        newX = x - 1;
        break;
      case "r":
        newX = x + 1;
        break;
      case "u":
        newY = y - 1;
        break;
      case "d":
        newY = y + 1;
        break;
    }

    let reward = -0.02,
      done = false;

    if (!this.isWall(newX, newY)) {
      this.snake_start = [newX, newY];
      this.data[x][y] = this.XY2Index(newX, newY);
      if (!this.isFood(newX, newY)) {
        const [x, y] = this.snake_end;
        this.snake_end = this.Index2XY(this.data[x][y]);
        this.data[x][y] = -1;
      } else {
        this.snake_len++;
        if (this.newFood()) reward = 1;
        else {
          reward = 10;
          done = true;
        }
        // reward -= this.consume * 0.001;
      }
      this.data[newX][newY] = this.XY2Index(newX, newY);
    } else {
      reward = -this.snake_len;
      done = true;
    }

    return [await this.getObservation(), reward, done];
  }
}

/**
 * 学习器
 */
class QLearningTable {
  /**
   * @param {string[]} actions
   */
  constructor(
    actions,
    learning_rate = 0.01,
    reward_decay = 0.9,
    e_greedy = 0.9
  ) {
    this.actions = actions;
    this.learning_rate = learning_rate;
    this.reward_decay = reward_decay;
    this.e_greedy = e_greedy;

    this.data = new RawVirtualTable(actions);

    this.stateLink = new Map();
  }
  /**
   * @type {RawVirtualTable}
   */
  data;
  /**
   * 加载参数
   * @param {Blob} data
   */
  async loadData(data) {
    await this.data.load(data);
  }
  /**
   * 存储参数
   */
  async saveData() {
    return await this.data.store();
  }

  //////////////////////////////
  newState() {
    return Object.fromEntries(this.actions.map((name) => [name, 0]));
  }

  // getState(observation) {
  //   let state = this.data[observation];
  //   if (!state) {
  //     state = this.newState();
  //     this.data[observation] = state;
  //   }
  //   return state;
  // }

  /**
   * 寻找某状态下的最佳决策
   * 从决策表中
   */
  getMax(observation) {
    //[action ,value]
    return this.data.getMaxValueAction(observation);
    // let max = ["", -Infinity];
    // Object.entries(state).forEach(([action, value]) => {
    //   if (value > max[1]) max = [action, value];
    // });
    // return max;
  }

  /**
   * 在预定环境选择最佳决策
   */
  predict(observation) {
    const list = this.actions;

    //随机选择动作
    //greedy为探索参数
    if (Math.random() > this.e_greedy) {
      //生成随机动作
      return list[(Math.random() * list.length) | 0];
    }
    //返回最大值的预测动作
    return this.getMax(observation)[0];
  }

  /**
   * 执行一步学习
   */
  learn(observation, action, reward, observation_) {
    //环境观察为一个hash字符串 此环境对应一个在此环境中做决策的数组
    //state[action]->value  or  table[observ][action]->value
    // const state = this.getState(observation);
    let newValue;
    if (observation_ !== "over") {
      // const state_ = this.getState(observation_);
      newValue = reward + this.reward_decay * this.getMax(observation_)[1];
    } else {
      newValue = reward;
    }
    const rawval = this.data.predict_value(observation, action);
    this.data.change(
      observation,
      action,
      this.learning_rate * (newValue - rawval) + rawval
    );
  }

  reset() {}
}
