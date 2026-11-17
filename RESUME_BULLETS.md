# Resume bullets for DigiDetect

These are the bullets shown on the site's Resume tab. Paste them into FlowCV.

**DigiDetect**, JavaScript | HTML/CSS | MNIST | Node.js
- Implemented a 13,000-parameter neural network from scratch in JavaScript (forward propagation, backpropagation, softmax cross-entropy, momentum SGD) with no ML framework
- Reached 95% accuracy on 1,000 held-out MNIST digits after 2.4 seconds of in-browser training on 5,000 examples, with an option to train on the full 60,000-image dataset
- Built an interactive site to train the model, compare hidden-layer sizes (32, 64, 128) and classify hand-drawn digits, backed by tests that check backpropagation against numerical gradients

Where the numbers come from: accuracy and training time are for the 64-unit network on the bundled sample
(run `npm test` in the DigiDetect repo, or `node scripts/check_nn.js` here). Accuracy varies between about 94% and 96%
with the random start. If you train on the full dataset, measure that accuracy and quote it instead.
