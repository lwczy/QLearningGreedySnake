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
    for (let observation = await env.reset(); ; ) {
      const action = RL.predict(observation);
      const [observation_, reward, done] = await env.step(action);
      RL.learn(observation, action, reward, observation_);
      observation = observation_;
      if (done) break;
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

async function normal() {
  stop = false;
  RL.e_greedy = 1;
  for (let episode = 1; ; episode++) {
    let score = 0;
    RL.reset();
    for (let observation = await env.reset(); ; ) {
      env.render();
      await new Promise((r) => setTimeout(r, 200));
      const action = RL.predict(observation);
      const [observation_, reward, done] = await env.step(action);
      RL.learn(observation, action, reward, observation_);
      observation = observation_;
      if (done) break;
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
