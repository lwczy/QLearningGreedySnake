const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const env = new Env(ctx, 300, 300, 60);
const RL = new QLearningTable(env.actions);
const episodeEle = document.getElementById("episode");
const scoreEle = document.getElementById("score");
const maxscoreEle = document.getElementById("maxscore");
const fileEle = document.getElementById("file");
let maxscore = 0;

let stop = false;

async function saveJSON() {
  download(await RL.saveData(), "data.config");
}

async function loadJSON() {
  const files = fileEle.files;
  if (files.length > 0) {
    const reader = new FileReader();
    await RL.loadData(files[0]);
  }
}

function stopAll() {
  stop = true;
}

async function quick() {
  stop = false;
  RL.e_greedy = 0.95;
  for (let episode = 1; ; episode++) {
    let score = 0;
    await RL.reset();
    //限制最大步数
    let s = 0;
    for (let observation = await env.reset(); ; s++) {
      const action = RL.predict(observation);
      const [observation_, reward, done] = await env.step(action);
      RL.learn(observation, action, reward, observation_);
      observation = observation_;
      if (done) break;
      if (s > 100) break;
    }
    score = env.snake_len;
    episodeEle.innerText = episode;
    scoreEle.innerText = score;
    if (score > maxscore) {
      maxscore = score;
      maxscoreEle.innerText = score;
    }
    if (!(episode % 1000)) await new Promise((r) => setTimeout(r));
    if (stop) break;
  }
}
/**
 * 执行间隔
 */
let stepgap = 0;
function fast() {
  stepgap = 0;
}
function slow() {
  stepgap = 200;
}
async function normal() {
  stop = false;
  RL.e_greedy = 1;
  for (let episode = 1; ; episode++) {
    let score = 0;
    RL.reset();
    let s = 0;
    for (let observation = await env.reset(); ; s++) {
      env.render();
      await new Promise((r) => setTimeout(r, stepgap));
      const action = RL.predict(observation);
      const [observation_, reward, done] = await env.step(action);
      RL.learn(observation, action, reward, observation_);
      observation = observation_;
      if (done) break;
      //去循环
      if (s > 100) break;
    }
    score = env.snake_len;
    episodeEle.innerText = episode;
    scoreEle.innerText = score;
    if (score > maxscore) {
      maxscore = score;
      maxscoreEle.innerText = score;
    }
    if (stop) break;
  }
}
