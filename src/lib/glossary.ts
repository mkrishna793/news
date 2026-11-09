// Jargon -> plain English. Powers the "no AI needed" explainer.
export type Term = { t: string; m: string; a?: string[]; an?: string };

export const GLOSSARY: Term[] = [
  // ---- AI / ML
  {
    t: "transformer",
    m: "the neural-network design behind ChatGPT-style models; it reads all the words at once and learns which ones matter to each other.",
    an: "like a reader who can glance at a whole page at once and instantly see which words relate to which.",
  },
  {
    t: "attention",
    m: "a trick that lets a model focus on the most relevant parts of its input instead of treating everything equally.",
    a: ["attention mechanism", "self-attention"],
  },
  {
    t: "neural network",
    m: "software loosely inspired by the brain: layers of simple connected units that learn patterns from examples.",
    a: ["neural networks", "neural net", "deep neural network"],
    an: "like a huge web of dimmer switches that gets tuned, bit by bit, until the output looks right.",
  },
  {
    t: "deep learning",
    m: "machine learning that uses many-layered neural networks to learn very complex patterns.",
  },
  {
    t: "machine learning",
    m: "teaching computers to find patterns from examples instead of hand-writing rules.",
  },
  {
    t: "large language model",
    m: "an AI trained on enormous amounts of text so it can read, write and reason in language.",
    a: [
      "llm",
      "llms",
      "large language models",
      "language model",
      "language models",
    ],
  },
  {
    t: "token",
    m: "a small chunk of text (a word or piece of a word) that models read and write one at a time.",
    a: ["tokens"],
  },
  {
    t: "embedding",
    m: "a list of numbers that captures the meaning of something so a computer can compare it with other things.",
    a: ["embeddings"],
  },
  {
    t: "fine-tuning",
    m: "taking an already-trained model and training it a little more on a specific task or style.",
    a: ["fine-tune", "finetuning", "fine-tuned", "finetune"],
  },
  {
    t: "reinforcement learning",
    m: "learning by trial and error: the AI tries things, gets rewards or penalties, and improves.",
    a: ["rl"],
    an: "like training a dog with treats — good actions are rewarded until they become habit.",
  },
  {
    t: "rlhf",
    m: "a way to make AI behave helpfully by letting humans rate its answers and training it to prefer the well-rated ones.",
    a: ["reinforcement learning from human feedback"],
  },
  {
    t: "diffusion model",
    m: "an image/video AI that starts from random noise and gradually cleans it up into a picture.",
    a: ["diffusion models", "diffusion"],
    an: "like sculpting by starting with a blurry block of static and slowly chiseling a picture out of it.",
  },
  {
    t: "gan",
    m: "two AIs competing: one forges fake data, the other tries to spot fakes, and both get better.",
    a: ["generative adversarial network", "generative adversarial networks"],
  },
  {
    t: "backpropagation",
    m: "the standard way a neural network learns: it measures its error and nudges every connection to reduce it.",
    a: ["backprop"],
  },
  {
    t: "gradient descent",
    m: "an algorithm that improves a model by repeatedly taking small steps downhill on an ‘error landscape’.",
    a: ["stochastic gradient descent", "sgd"],
  },
  {
    t: "loss function",
    m: "a score of how wrong the model currently is; training tries to make it smaller.",
    a: ["loss"],
  },
  {
    t: "overfitting",
    m: "when a model memorises its training examples and then fails on anything new.",
    a: ["overfit"],
  },
  {
    t: "benchmark",
    m: "a standard test used to compare how good different AI systems are.",
    a: ["benchmarks"],
  },
  {
    t: "parameters",
    m: "the adjustable settings of a model or system. In AI they are the numbers that store what the model has learned — more usually means a bigger model.",
    a: ["parameter", "weights"],
  },
  {
    t: "inference",
    m: "using an already-trained model to produce an answer (as opposed to training it).",
  },
  {
    t: "quantization",
    m: "shrinking a model by storing its numbers with less precision so it runs faster on smaller hardware.",
    a: ["quantized", "quantisation"],
  },
  {
    t: "distillation",
    m: "training a small ‘student’ model to copy the behaviour of a big ‘teacher’ model.",
    a: ["knowledge distillation", "distilled"],
  },
  {
    t: "mixture of experts",
    m: "a model made of many specialist sub-networks where only a few are used for each input, saving compute.",
    a: ["moe", "mixture-of-experts"],
  },
  {
    t: "retrieval-augmented generation",
    m: "letting an AI look things up in a document store before answering so it’s more accurate.",
    a: ["rag", "retrieval augmented generation"],
  },
  {
    t: "agent",
    m: "an AI that doesn’t just answer — it plans steps and uses tools (search, code, apps) to get things done.",
    a: ["agents", "agentic", "ai agent", "ai agents"],
  },
  {
    t: "multimodal",
    m: "able to handle more than one kind of input, like text, images, audio and video together.",
    a: ["multi-modal"],
  },
  {
    t: "zero-shot",
    m: "doing a task the model was never specifically trained for, with no examples given.",
    a: ["zero shot"],
  },
  {
    t: "few-shot",
    m: "learning a new task from just a handful of examples.",
    a: ["few shot"],
  },
  {
    t: "chain-of-thought",
    m: "making the model write out its reasoning step by step, which usually improves answers.",
    a: ["chain of thought", "cot"],
  },
  {
    t: "hallucination",
    m: "when an AI confidently states something that is simply made up.",
    a: ["hallucinations", "hallucinate"],
  },
  {
    t: "scaling law",
    m: "a pattern showing that models predictably get better as you add more data, compute and parameters.",
    a: ["scaling laws"],
  },
  {
    t: "context window",
    m: "how much text a model can ‘keep in mind’ at one time.",
  },
  {
    t: "pretraining",
    m: "the first, huge training stage where a model learns general knowledge from massive data.",
    a: ["pre-training", "pre-trained", "pretrained"],
  },
  {
    t: "lora",
    m: "a cheap way to fine-tune a big model by training only a small add-on instead of the whole thing.",
    a: ["low-rank adaptation"],
  },
  {
    t: "state space model",
    m: "an alternative to transformers that reads sequences efficiently, handling very long inputs cheaply.",
    a: ["state-space model", "ssm", "mamba"],
  },
  {
    t: "convolutional neural network",
    m: "a neural network specialised for images; it scans small patches to detect edges, shapes and objects.",
    a: ["cnn", "cnns", "convolutional"],
  },
  {
    t: "spiking neural network",
    m: "a neural network that communicates with brief electrical ‘spikes’ like real neurons, which can be very energy-efficient.",
    a: ["snn", "snns", "spiking"],
  },
  {
    t: "neuromorphic",
    m: "computer hardware designed to work like the brain, using spikes and local memory to save energy.",
    a: ["neuromorphic computing"],
  },
  {
    t: "self-supervised",
    m: "learning from unlabeled data by inventing its own puzzles (e.g. predict the missing word).",
    a: ["self-supervised learning", "unsupervised"],
  },
  {
    t: "contrastive learning",
    m: "teaching a model what is similar and different by showing it matching and non-matching pairs.",
    a: ["contrastive"],
  },
  {
    t: "foundation model",
    m: "a very large general-purpose model that can be adapted to many different tasks.",
    a: ["foundation models"],
  },
  {
    t: "open-weights",
    m: "a model whose trained numbers are published so anyone can download and run it.",
    a: [
      "open weights",
      "open-weight",
      "open-source model",
      "open source model",
    ],
  },
  {
    t: "alignment",
    m: "making sure an AI’s behaviour matches what humans actually want and consider safe.",
    a: ["ai alignment"],
  },
  {
    t: "jailbreak",
    m: "a prompt trick that gets an AI to ignore its safety rules.",
    a: ["jailbreaks", "jailbreaking"],
  },
  {
    t: "prompt injection",
    m: "hiding instructions in text so an AI follows an attacker’s orders instead of yours.",
    a: ["prompt injections"],
  },
  {
    t: "gpu",
    m: "a graphics chip that happens to be excellent at the maths AI needs; the main hardware for training models.",
    a: ["gpus"],
  },
  {
    t: "latency",
    m: "the delay between asking for something and getting the answer.",
  },
  {
    t: "vision-language model",
    m: "an AI that understands images and text together, e.g. can describe a photo.",
    a: ["vlm", "vlms", "vision language model"],
  },
  {
    t: "world model",
    m: "an AI’s internal simulation of how the world works, used to predict what happens next.",
    a: ["world models"],
  },
  {
    t: "graph neural network",
    m: "a neural network built for data shaped like networks — molecules, social links, maps.",
    a: ["gnn", "gnns", "graph neural networks"],
  },
  {
    t: "autoencoder",
    m: "a network that squeezes data into a tiny summary and tries to rebuild it, learning the essentials.",
    a: ["autoencoders", "variational autoencoder", "vae"],
  },
  {
    t: "transfer learning",
    m: "reusing what a model learned on one task to get a head start on another.",
  },
  {
    t: "ablation",
    m: "an experiment that removes one part of a system to see how much that part really mattered.",
    a: ["ablation study", "ablations"],
  },
  {
    t: "state-of-the-art",
    m: "the best published result so far on a given test.",
    a: ["sota"],
  },
  {
    t: "in-context learning",
    m: "a model picking up a new task just from examples placed in the prompt, without retraining.",
  },
  {
    t: "synthetic data",
    m: "artificially generated training data, often produced by another AI.",
  },
  {
    t: "reasoning model",
    m: "an AI that ‘thinks’ for longer before answering, working through problems step by step.",
    a: ["reasoning models"],
  },
  {
    t: "generative",
    m: "able to create new content — text, images, music, molecules — rather than only classify existing things.",
    a: ["generative ai", "generative model", "generative models"],
  },
  {
    t: "bayesian",
    m: "a way of reasoning that keeps updating its beliefs as new evidence arrives.",
    a: ["bayesian inference"],
  },
  {
    t: "optimization",
    m: "the maths of finding the best settings for something.",
    a: ["optimisation", "optimizer"],
  },
  {
    t: "gradient",
    m: "the direction in which a change would improve (or worsen) a model’s score.",
  },
  {
    t: "robustness",
    m: "how well a system keeps working when inputs are noisy, unusual or adversarial.",
    a: ["robust"],
  },
  // ---- Quantum
  {
    t: "qubit",
    m: "the quantum version of a bit: unlike a 0-or-1 bit it can be in a blend of both until measured.",
    a: ["qubits", "quantum bit", "quantum bits"],
    an: "like a coin spinning in the air — not heads or tails until it lands (is measured).",
  },
  {
    t: "superposition",
    m: "a quantum object being in several possible states at once until you look.",
    a: ["superpositions"],
  },
  {
    t: "entanglement",
    m: "a link between quantum particles so that measuring one instantly tells you about the other, however far apart.",
    a: ["entangled"],
    an: "like a pair of magic dice that always land on matching numbers no matter how far apart you roll them.",
  },
  {
    t: "decoherence",
    m: "quantum states getting disturbed by their surroundings and losing their ‘quantumness’ — the main enemy of quantum computers.",
    a: ["dephasing"],
  },
  {
    t: "quantum error correction",
    m: "using many fragile physical qubits together to protect one reliable ‘logical’ qubit from errors.",
    a: ["error correction", "error-correcting", "qec", "surface code"],
  },
  {
    t: "quantum advantage",
    m: "when a quantum computer beats the best normal computer at a real task.",
    a: ["quantum supremacy", "quantum speedup"],
  },
  {
    t: "quantum gate",
    m: "a basic operation on qubits, like a logic gate in normal computers.",
    a: ["quantum gates", "two-qubit gate", "gate fidelity"],
  },
  {
    t: "nisq",
    m: "today’s noisy, medium-sized quantum computers that are too error-prone for the grand applications.",
    a: ["noisy intermediate-scale quantum"],
  },
  {
    t: "logical qubit",
    m: "a robust qubit built out of many error-prone physical qubits.",
    a: ["logical qubits"],
  },
  {
    t: "fidelity",
    m: "how accurately an operation does what it should (100% = perfect).",
  },
  {
    t: "coherence time",
    m: "how long a qubit keeps its quantum state before it decays.",
  },
  {
    t: "superconducting qubit",
    m: "a qubit made from a tiny electrical circuit cooled close to absolute zero.",
    a: ["superconducting qubits", "transmon", "superconducting circuit"],
  },
  {
    t: "trapped ion",
    m: "a qubit made from a single charged atom held in place by electric fields and manipulated with lasers.",
    a: ["trapped ions", "trapped-ion"],
  },
  {
    t: "neutral atom",
    m: "a qubit made of an uncharged atom held by laser ‘tweezers’.",
    a: ["neutral atoms", "rydberg", "optical tweezers"],
  },
  {
    t: "photonic",
    m: "using particles of light as the carrier of information.",
    a: ["photon", "photons", "photonics"],
  },
  {
    t: "quantum annealing",
    m: "a quantum approach that searches for the best solution to an optimisation problem by letting the system settle into its lowest-energy state.",
  },
  {
    t: "quantum key distribution",
    m: "sending encryption keys using quantum physics so any eavesdropping is detectable.",
    a: ["qkd"],
  },
  {
    t: "hamiltonian",
    m: "the formula that describes a system’s total energy and therefore how it evolves.",
    a: ["hamiltonians"],
  },
  {
    t: "wave function",
    m: "the mathematical description of a quantum system that gives the odds of each measurement result.",
    a: ["wavefunction"],
  },
  {
    t: "bell inequality",
    m: "a test that proves nature really is ‘quantum’ and can’t be explained by hidden everyday variables.",
    a: ["bell test", "bell's theorem"],
  },
  {
    t: "quantum simulation",
    m: "using a quantum system to imitate another quantum system (like a molecule) that’s too hard for normal computers.",
    a: ["quantum simulator", "analog quantum simulation"],
  },
  {
    t: "variational quantum",
    m: "a hybrid method where a quantum chip and a normal computer take turns tuning a circuit to solve a problem.",
    a: ["vqe", "qaoa", "variational quantum algorithm"],
  },
  {
    t: "quantum machine learning",
    m: "mixing quantum computing with machine learning, hoping for speedups on certain learning tasks.",
    a: ["qml"],
  },
  {
    t: "many-body",
    m: "physics of lots of interacting particles at once, which is extremely hard to calculate.",
    a: ["many-body physics"],
  },
  {
    t: "spin",
    m: "a tiny built-in magnetism of particles that can point ‘up’ or ‘down’ — often used to store quantum info.",
    a: ["spins"],
  },
  {
    t: "superconductor",
    m: "a material that carries electricity with zero resistance when cold enough.",
    a: ["superconductivity", "superconducting"],
  },
  {
    t: "topological",
    m: "relying on a shape-like property that is hard to destroy by small disturbances — promising for stable quantum bits.",
    a: ["topological insulator", "topological phase", "majorana"],
  },
  {
    t: "quantum dot",
    m: "a nanoscale crystal that traps single electrons and can act as a qubit or a light emitter.",
    a: ["quantum dots"],
  },
  {
    t: "bose-einstein condensate",
    m: "a state of matter where many atoms, chilled to near absolute zero, act like one giant quantum wave.",
    a: ["bec"],
  },
  {
    t: "phase transition",
    m: "an abrupt change in a system’s nature, like water freezing to ice.",
    a: ["phase transitions"],
  },
  {
    t: "cryogenic",
    m: "working at extremely low temperatures.",
    a: ["dilution refrigerator"],
  },
  {
    t: "cryptography",
    m: "the science of keeping information secret and secure.",
    a: ["post-quantum", "encryption"],
  },
  // ---- Neuroscience
  {
    t: "neuron",
    m: "a brain cell that receives, processes and passes on electrical and chemical signals.",
    a: ["neurons", "neuronal"],
    an: "like a tiny decision-maker that ‘fires’ only when enough of its inputs vote yes.",
  },
  {
    t: "synapse",
    m: "the junction where one neuron passes a signal to the next.",
    a: ["synapses", "synaptic"],
  },
  {
    t: "cortex",
    m: "the wrinkled outer layer of the brain involved in thinking, perception and movement.",
    a: ["cortical", "neocortex"],
  },
  {
    t: "hippocampus",
    m: "a seahorse-shaped brain region crucial for forming new memories and navigating space.",
    a: ["hippocampal"],
  },
  {
    t: "prefrontal cortex",
    m: "the front part of the brain handling planning, decisions and self-control.",
    a: ["pfc"],
  },
  {
    t: "amygdala",
    m: "an almond-shaped region that processes fear, emotion and threat.",
  },
  {
    t: "plasticity",
    m: "the brain’s ability to rewire itself in response to experience.",
    a: ["neuroplasticity", "synaptic plasticity"],
  },
  {
    t: "fmri",
    m: "a scan that shows which brain areas are active by tracking blood flow.",
    a: ["functional mri", "functional magnetic resonance imaging"],
  },
  {
    t: "eeg",
    m: "electrodes on the scalp that record the brain’s electrical rhythms.",
    a: ["electroencephalography"],
  },
  {
    t: "meg",
    m: "a scan that measures the tiny magnetic fields produced by brain activity.",
    a: ["magnetoencephalography"],
  },
  {
    t: "connectome",
    m: "a complete wiring diagram of the connections between neurons.",
    a: ["connectomics", "connectomes"],
  },
  {
    t: "optogenetics",
    m: "a method that uses light to switch specific genetically-tagged neurons on or off.",
    a: ["optogenetic"],
  },
  {
    t: "neurotransmitter",
    m: "a chemical messenger neurons use to talk to each other.",
    a: ["neurotransmitters", "neuromodulator"],
  },
  {
    t: "dopamine",
    m: "a brain chemical tied to motivation, reward and movement.",
    a: ["dopaminergic"],
  },
  {
    t: "glia",
    m: "the brain’s support cells that nourish, protect and help tune neurons.",
    a: ["astrocyte", "astrocytes", "microglia", "glial"],
  },
  {
    t: "brain-computer interface",
    m: "technology that lets brain signals control a computer or machine directly.",
    a: ["bci", "brain computer interface", "brain–computer interface"],
  },
  {
    t: "neural oscillation",
    m: "rhythmic waves of brain activity (like alpha or gamma waves) linked to attention and memory.",
    a: ["oscillations", "brain waves", "gamma oscillations", "theta"],
  },
  {
    t: "calcium imaging",
    m: "watching neurons light up under a microscope as they fire.",
    a: ["two-photon", "two-photon imaging"],
  },
  {
    t: "electrophysiology",
    m: "directly measuring the electrical activity of cells.",
    a: ["patch-clamp", "neuropixels"],
  },
  {
    t: "neurodegeneration",
    m: "the progressive loss of neurons in diseases like Alzheimer’s and Parkinson’s.",
    a: [
      "neurodegenerative",
      "alzheimer's",
      "alzheimer",
      "parkinson's",
      "parkinson",
    ],
  },
  {
    t: "cognition",
    m: "the mental processes of knowing: attention, memory, reasoning and language.",
    a: ["cognitive"],
  },
  {
    t: "working memory",
    m: "the mental notepad you use to hold things in mind for a few seconds.",
  },
  {
    t: "default mode network",
    m: "brain regions that become active when you daydream or let your mind wander.",
    a: ["dmn"],
  },
  {
    t: "predictive coding",
    m: "the idea that the brain constantly predicts what it will sense and only processes the surprises.",
    a: ["predictive processing", "free energy principle", "active inference"],
  },
  {
    t: "basal ganglia",
    m: "deep brain structures that help select actions and form habits.",
  },
  {
    t: "cerebellum",
    m: "the ‘little brain’ at the back that fine-tunes movement and timing.",
  },
  {
    t: "thalamus",
    m: "the brain’s relay station that routes sensory signals to the cortex.",
  },
  {
    t: "myelin",
    m: "the fatty insulation on axons that speeds up neural signals.",
    a: ["myelination"],
  },
  {
    t: "axon",
    m: "the long cable of a neuron that carries its output signal.",
    a: ["axons"],
  },
  {
    t: "dendrite",
    m: "the branching receivers of a neuron that collect incoming signals.",
    a: ["dendrites", "dendritic"],
  },
  { t: "neurogenesis", m: "the birth of new neurons." },
  {
    t: "transcriptomic",
    m: "describing which genes are switched on in a cell.",
    a: ["transcriptome", "single-cell rna", "scrna-seq", "rna-seq"],
  },
  {
    t: "biomarker",
    m: "a measurable sign in the body (like a blood protein) that indicates a disease or state.",
    a: ["biomarkers"],
  },
  {
    t: "crispr",
    m: "a gene-editing tool that can cut and change DNA at precise locations.",
    a: ["gene editing", "cas9"],
  },
  {
    t: "protein folding",
    m: "how a chain of amino acids twists into the 3D shape that determines what a protein does.",
    a: ["protein structure", "alphafold"],
  },
  { t: "in vivo", m: "done inside a living organism." },
  {
    t: "in vitro",
    m: "done in a dish or test tube, outside a living organism.",
  },
  {
    t: "randomized controlled trial",
    m: "the gold-standard experiment: people are randomly split into treatment and comparison groups.",
    a: ["randomised controlled trial", "rct", "clinical trial"],
  },
  {
    t: "meta-analysis",
    m: "a study that pools the results of many earlier studies to get a stronger answer.",
    a: ["meta analysis"],
  },
  {
    t: "preprint",
    m: "a research paper shared publicly before it has been peer-reviewed by other scientists.",
    a: ["preprints"],
  },
  // ---- Industry / geopolitics
  {
    t: "export controls",
    m: "government rules that restrict selling sensitive technology (like advanced AI chips) to certain countries.",
    a: ["export control", "export restrictions", "export ban"],
  },
  {
    t: "sanctions",
    m: "penalties — usually financial or trade limits — one country imposes on another.",
    a: ["sanction"],
  },
  { t: "tariff", m: "a tax on imported goods.", a: ["tariffs"] },
  {
    t: "semiconductor",
    m: "a material (like silicon) whose electrical behaviour can be finely controlled — the basis of every computer chip.",
    a: ["semiconductors", "chipmaker", "chipmakers", "chips"],
  },
  {
    t: "fab",
    m: "a chip factory (‘fabrication plant’) that costs billions to build.",
    a: ["foundry", "fabs"],
  },
  {
    t: "ceasefire",
    m: "an agreement to temporarily stop fighting.",
    a: ["truce"],
  },
  {
    t: "brics",
    m: "a bloc of large emerging economies (Brazil, Russia, India, China, South Africa and others).",
  },
  {
    t: "nato",
    m: "a military alliance of North American and European countries that pledge to defend each other.",
  },
  {
    t: "quad",
    m: "a security dialogue between India, the US, Japan and Australia.",
  },
  {
    t: "g20",
    m: "the group of 20 major economies that coordinate global economic policy.",
  },
  {
    t: "supply chain",
    m: "the journey of materials and parts from raw source to finished product.",
    a: ["supply chains"],
  },
  {
    t: "market capitalization",
    m: "a company’s total stock-market value (share price × number of shares).",
    a: ["market cap", "market value"],
  },
  {
    t: "earnings",
    m: "a company’s profit report; stocks often jump or drop when it comes out.",
    a: ["earnings report", "quarterly results"],
  },
  { t: "guidance", m: "a company’s own forecast of its upcoming results." },
  {
    t: "ipo",
    m: "when a private company first sells shares to the public on the stock market.",
    a: ["initial public offering"],
  },
  {
    t: "antitrust",
    m: "laws that stop companies from becoming illegal monopolies.",
  },
  {
    t: "layoffs",
    m: "when a company cuts jobs, often to reduce costs.",
    a: ["layoff", "job cuts"],
  },
  { t: "h-1b", m: "a US work visa for skilled foreign workers.", a: ["h1b"] },
  {
    t: "opt",
    m: "a US program that lets international students work for a period after graduating.",
    a: ["optional practical training", "stem opt"],
  },
  {
    t: "nifty",
    m: "India’s main stock index tracking the 50 largest listed companies.",
    a: ["nifty 50", "sensex"],
  },
  {
    t: "inflation",
    m: "the general rise in prices over time, meaning money buys less.",
  },
  {
    t: "interest rate",
    m: "the price of borrowing money; central banks raise or cut it to cool or boost the economy.",
    a: ["rate cut", "rate hike", "repo rate"],
  },
  {
    t: "national education policy",
    m: "India’s big reform plan for schools and universities.",
    a: ["nep", "nep 2020"],
  },
  {
    t: "geopolitics",
    m: "how geography, power and politics between countries shape world events.",
    a: ["geopolitical"],
  },
];

const compiled = GLOSSARY.map((g) => {
  const names = [g.t, ...(g.a ?? [])].map((s) => s.toLowerCase());
  const esc = names
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  return {
    g,
    re: new RegExp(`(?<![a-z0-9])(?:${esc.join("|")})(?![a-z0-9])`, "i"),
  };
});

// Terms that only make sense in news about business / policy, never in science abstracts.
const NEWS_ONLY = new Set([
  "guidance",
  "earnings",
  "ipo",
  "layoffs",
  "market capitalization",
  "nifty",
  "inflation",
  "interest rate",
  "antitrust",
  "tariff",
  "sanctions",
  "supply chain",
  "opt",
  "h-1b",
  "quad",
  "g20",
  "brics",
  "nato",
  "ceasefire",
  "export controls",
  "national education policy",
  "geopolitics",
  "fab",
]);

export function findTerms(text: string, max = 8, kind = "paper"): Term[] {
  const found: { g: Term; idx: number }[] = [];
  const science = kind === "paper" || kind === "applied" || kind === "ai_news";
  for (const c of compiled) {
    if (science && NEWS_ONLY.has(c.g.t)) continue;
    const m = c.re.exec(text);
    if (m) found.push({ g: c.g, idx: m.index });
  }
  return found
    .sort((a, b) => a.idx - b.idx)
    .slice(0, max)
    .map((f) => f.g);
}

export function countTerms(text: string): number {
  let n = 0;
  for (const c of compiled) if (c.re.test(text)) n++;
  return n;
}
