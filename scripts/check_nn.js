/* Trains the same network the site uses and prints test accuracy.  Run: node scripts/check_nn.js */
const path = require("path");
globalThis.window = globalThis;
require(path.join(__dirname, "..", "data", "digits.js"));
const { MLP, decode } = require(path.join(__dirname, "..", "js", "lib", "nn.js"));
function rng(seed) { let s = seed >>> 0; const next = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; next.gauss = () => { let u = 0; while (u === 0) u = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * next()); }; return next; }
const D = globalThis.DIGITS, train = decode(D.train, D.side), test = decode(D.test, D.side), rand = rng(1);
for (const hidden of [32, 64, 128]) {
  const net = new MLP(train.dim, hidden, 10, rand), order = Array.from({ length: train.n }, (_, i) => i);
  const t0 = Date.now();
  for (let epoch = 1; epoch <= 12; epoch++) {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (let b = 0; b < train.n; b += 32) net.trainBatch(train.x, train.y, order.slice(b, b + 32), 0.08);
    if (epoch % 4 === 0) console.log(`hidden ${hidden}  epoch ${epoch}  test accuracy ${(100 * net.accuracy(test.x, test.y, test.n)).toFixed(1)}%  (${Date.now() - t0} ms)`);
  }
}
