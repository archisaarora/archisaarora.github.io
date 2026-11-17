/* A small neural network written from scratch: one hidden layer (ReLU), a softmax
   output, cross-entropy loss, and mini-batch gradient descent with momentum.
   No libraries. Works in the browser and in Node. */
(function (root) {
  class MLP {
    constructor(nIn, nHid, nOut, rand) {
      this.nIn = nIn; this.nHid = nHid; this.nOut = nOut;
      this.W1 = new Float32Array(nIn * nHid); this.b1 = new Float32Array(nHid);
      this.W2 = new Float32Array(nHid * nOut); this.b2 = new Float32Array(nOut);
      const s1 = Math.sqrt(2 / nIn), s2 = Math.sqrt(2 / nHid);          /* He initialisation */
      for (let i = 0; i < this.W1.length; i++) this.W1[i] = rand.gauss() * s1;
      for (let i = 0; i < this.W2.length; i++) this.W2[i] = rand.gauss() * s2;
      this.vW1 = new Float32Array(this.W1.length); this.vb1 = new Float32Array(nHid);
      this.vW2 = new Float32Array(this.W2.length); this.vb2 = new Float32Array(nOut);
      this.gW1 = new Float32Array(this.W1.length); this.gb1 = new Float32Array(nHid);
      this.gW2 = new Float32Array(this.W2.length); this.gb2 = new Float32Array(nOut);
      this.h = new Float32Array(nHid); this.p = new Float32Array(nOut); this.dh = new Float32Array(nHid);
    }

    /* x: Float32Array view of one input. Fills this.h and this.p (class probabilities). */
    forward(x, off = 0) {
      const { nIn, nHid, nOut, W1, b1, W2, b2, h, p } = this;
      for (let j = 0; j < nHid; j++) {
        let s = b1[j]; const r = j * nIn;
        for (let i = 0; i < nIn; i++) s += W1[r + i] * x[off + i];
        h[j] = s > 0 ? s : 0;
      }
      let max = -Infinity;
      for (let k = 0; k < nOut; k++) {
        let s = b2[k]; const r = k * nHid;
        for (let j = 0; j < nHid; j++) s += W2[r + j] * h[j];
        p[k] = s; if (s > max) max = s;
      }
      let sum = 0;
      for (let k = 0; k < nOut; k++) { p[k] = Math.exp(p[k] - max); sum += p[k]; }
      for (let k = 0; k < nOut; k++) p[k] /= sum;
      return p;
    }

    predict(x, off = 0) {
      const p = this.forward(x, off); let best = 0;
      for (let k = 1; k < p.length; k++) if (p[k] > p[best]) best = k;
      return best;
    }

    /* Backpropagation: fills gW1, gb1, gW2, gb2 with gradients summed over the examples in idx. Returns the mean loss. */
    backward(X, Y, idx) {
      const { nIn, nHid, nOut, W2, h, p, dh, gW1, gb1, gW2, gb2 } = this;
      gW1.fill(0); gb1.fill(0); gW2.fill(0); gb2.fill(0);
      let loss = 0;
      for (const n of idx) {
        const off = n * nIn;
        this.forward(X, off);
        loss -= Math.log(p[Y[n]] + 1e-9);
        dh.fill(0);
        for (let k = 0; k < nOut; k++) {
          const d = p[k] - (k === Y[n] ? 1 : 0), r = k * nHid;      /* dLoss/dlogit for softmax + cross-entropy */
          gb2[k] += d;
          for (let j = 0; j < nHid; j++) { gW2[r + j] += d * h[j]; dh[j] += d * W2[r + j]; }
        }
        for (let j = 0; j < nHid; j++) {
          if (h[j] <= 0) continue;                                  /* ReLU passes gradient only where it was active */
          const d = dh[j], r = j * nIn; gb1[j] += d;
          for (let i = 0; i < nIn; i++) gW1[r + i] += d * X[off + i];
        }
      }
      return loss / idx.length;
    }

    /* Mean cross-entropy loss on the examples in idx, without changing anything. */
    loss(X, Y, idx) {
      let loss = 0;
      for (const n of idx) loss -= Math.log(this.forward(X, n * this.nIn)[Y[n]] + 1e-9);
      return loss / idx.length;
    }

    /* One gradient step with momentum on the examples listed in idx. Returns the mean loss. */
    trainBatch(X, Y, idx, lr, momentum = 0.9) {
      const loss = this.backward(X, Y, idx), s = lr / idx.length;
      step(this.W1, this.vW1, this.gW1, s, momentum); step(this.b1, this.vb1, this.gb1, s, momentum);
      step(this.W2, this.vW2, this.gW2, s, momentum); step(this.b2, this.vb2, this.gb2, s, momentum);
      return loss;
    }

    accuracy(X, Y, n) {
      let ok = 0;
      for (let i = 0; i < n; i++) if (this.predict(X, i * this.nIn) === Y[i]) ok++;
      return ok / n;
    }
  }
  function step(w, v, g, s, m) { for (let i = 0; i < w.length; i++) { v[i] = m * v[i] - s * g[i]; w[i] += v[i]; } }

  /* Decode the base64 dataset into typed arrays, pixels scaled to 0..1. */
  function decode(set, side) {
    const bin = (s) => { if (typeof atob === "function") { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; } return new Uint8Array(Buffer.from(s, "base64")); };
    const px = bin(set.x), x = new Float32Array(px.length);
    for (let i = 0; i < px.length; i++) x[i] = px[i] / 255;
    return { n: set.n, x, y: bin(set.y), dim: side * side };
  }

  const api = { MLP, decode };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.NN = api;
})(typeof window !== "undefined" ? window : globalThis);
