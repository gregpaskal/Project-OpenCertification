// ===============================================================
// @file: instruments-config.js
// @filepath: _docs/_dashboard/instruments/instruments-config.js
// @version: 1.0.0
// @updated: {{FOUNDED_AT}}
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Instruments page's own settings, loaded by instruments.html before the type's instruments.js. The
//   value after the equals sign is plain JSON: double quotes, no comments inside it. topic is the instrument lane (an
//   ntfy topic) on relay; only messages of this kind from this project are kept; since is how far back the relay is read
//   on opening. strip adds fields to the Status Strip; meters are the gauges (key, title, unit, max, digits, warnBelow,
//   badBelow, word for a text gauge, note, and the learning card: what, like, measured, watch, terms); cards are the
//   Runs Table columns with no gauge of their own; columns are the Runs Table (label, path, digits, left, level, key);
//   terms label glossary term ids; legend explains the gauges. The example measures a local model on the Mac, as
//   Project-AI-Local's model-sampler.js sends it; replace it with what this project measures, and fill in measured with
//   what has been seen. A FOUNDED file: the project's from birth.
// @tags: instruments, settings, instrument-lane, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// {{FOUNDED_DATE}}  Greg & Claude  1.0.0          Founded from the Instruments page type 1.0.0
// ===============================================================

window.DASH_INSTRUMENTS = {
  "topic": "{{LANE_TOPIC}}",
  "relay": "https://ntfy.sh",
  "project": "{{PROJECT_KEY}}",
  "kind": "perf",
  "since": "12h",
  "liveSeconds": 30,
  "timeZone": "America/Chicago",
  "subtitle": "a local model on the Mac, live from the instrument lane",
  "source": "the project's sampler",
  "measuredLabel": "On this Mac",
  "strip": [
    {
      "label": "ctx",
      "path": [
        "result.ctx_loaded",
        "last.ctx_loaded",
        "run.ctx"
      ],
      "digits": 0
    }
  ],
  "meters": [
    {
      "key": "tps",
      "title": "Speed",
      "unit": "tok/s",
      "max": 120,
      "digits": 1,
      "note": "words written per second",
      "what": "How many tokens the model writes per second, counted by Ollama itself (the eval rate). A token is a piece of a word, so this is the model's typing speed.",
      "like": "A typist's words per minute. To write each token the Mac reads every weight of the model from memory once, so a bigger model is a longer page to reread before every word.",
      "watch": "Compare a run with the same model's recent runs at the same context. Speed also sags a little as a long answer grows.",
      "terms": [
        "eval-rate",
        "token",
        "memory-bandwidth"
      ],
      "measured": ""
    },
    {
      "key": "ttft_ms",
      "title": "First word",
      "unit": "ms",
      "max": 5000,
      "digits": 0,
      "note": "wait before the first word",
      "what": "Wall-clock time from sending the prompt to the first token coming back. It is three waits in a row: loading the model, reading the prompt, and writing the first token.",
      "like": "Starting a car. A cold engine takes seconds to turn over; one already idling pulls away at once.",
      "watch": "Recorded, never judged: it mostly says whether the model was already in memory. A large wait with Load 0 in the Runs Table would be worth a look.",
      "terms": [
        "prompt-eval-rate",
        "token"
      ],
      "measured": ""
    },
    {
      "key": "mem_gb",
      "title": "Memory",
      "unit": "GB",
      "max": 64,
      "digits": 1,
      "note": "the model in memory",
      "what": "The memory the loaded model holds: its weights, plus the KV cache, the scratch space that remembers the conversation so far. The cache grows with the context size set at load.",
      "like": "A workbench: the tools always take the same room (the weights), and a bigger job needs a bigger work surface (the context).",
      "watch": "When the model and its context outgrow what the GPU may use, part spills to the CPU (watch GPU). Size the context when the model loads, not after.",
      "terms": [
        "kv-cache",
        "context-window",
        "sliding-window-attention"
      ],
      "measured": ""
    },
    {
      "key": "gpu_pct",
      "title": "GPU",
      "unit": "%",
      "max": 100,
      "digits": 0,
      "warnBelow": 100,
      "badBelow": 70,
      "note": "share of the model on the GPU",
      "what": "The share of the model the GPU holds. The rest runs on the CPU, which is much slower at this work.",
      "like": "A highway and side roads. Everything on the GPU takes the highway; any part left on the CPU takes the side roads, and the whole trip waits for it.",
      "watch": "Below 100% is WARN (amber); below 70% is red. Lower the context and run again.",
      "terms": [
        "unified-memory"
      ],
      "measured": ""
    },
    {
      "key": "mem_free_pct",
      "title": "Free",
      "unit": "%",
      "max": 100,
      "digits": 0,
      "warnBelow": 20,
      "badBelow": 10,
      "note": "memory the Mac has left",
      "what": "The share of the whole Mac's memory still free for everything else, as macOS reports it.",
      "like": "Counter space left in a shared kitchen. The model takes its share, and every other app works in what is left.",
      "watch": "Below 20% is amber, below 10% red: macOS starts compressing memory and writing it to disk.",
      "terms": [
        "unified-memory"
      ],
      "measured": ""
    },
    {
      "key": "swap_mb",
      "title": "Swap",
      "unit": "MB",
      "max": 8192,
      "digits": 0,
      "note": "memory spilled to disk",
      "what": "Memory macOS has written out to the disk because RAM ran short. The number includes swap left over from earlier work.",
      "like": "A storage unit across town. It holds the overflow, but every trip to fetch something is slow.",
      "watch": "What counts is growth during a run, not what was carried in from earlier work.",
      "terms": [],
      "measured": ""
    },
    {
      "key": "therm",
      "title": "Thermal",
      "word": true,
      "note": "macOS thermal warning",
      "what": "Whether macOS has recorded a thermal warning or slowed the CPU to keep it cool.",
      "like": "An engine's temperature warning light. none-recorded means the light is off; it is not a temperature reading.",
      "watch": "Any recorded level is WARN. Long heavy runs are where it would show first.",
      "terms": [],
      "measured": ""
    }
  ],
  "cards": [
    {
      "key": "model",
      "title": "Model",
      "what": "The model's name as Ollama knows it: its family, then its size after the colon. 8b means about 8 billion parameters, the learned numbers that are the model.",
      "like": "A book's title and edition. llama3.1 is the series, 8b how thick the volume is; the same series comes in thin and thick editions.",
      "watch": "Compare models only at the same context: the Ctx column changes memory more than you might expect.",
      "terms": [
        "model-family",
        "parameter",
        "quantization",
        "open-weight-model"
      ],
      "measured": ""
    },
    {
      "key": "ctx",
      "title": "Ctx",
      "what": "The context size the model was loaded with: how many tokens of conversation it can hold at once, prompt and answer together. It is set when the model loads.",
      "like": "The size of a whiteboard. A bigger board holds more of the conversation, but it has to be bought (memory) before anyone writes on it.",
      "watch": "Speed barely changes with context; memory changes a lot. A run only compares with runs at the same Ctx.",
      "terms": [
        "context-window",
        "kv-cache",
        "sliding-window-attention"
      ],
      "measured": ""
    },
    {
      "key": "load_s",
      "title": "Load s",
      "what": "Seconds Ollama spent loading the model into memory before this run, from its own counters. 0.00 means the model was already loaded.",
      "like": "Warming up an engine. The first trip of the day waits for it; the next one pulls away at once.",
      "watch": "Load explains most of First word. A model stays loaded about 5 minutes after its last run, then Ollama unloads it.",
      "terms": [],
      "measured": ""
    },
    {
      "key": "tokens",
      "title": "Tokens",
      "what": "How many tokens the model wrote in its answer, from Ollama's own counters. Speed is these tokens divided by the seconds spent writing them.",
      "like": "The word count of an essay. Two students given the same question write answers of different lengths.",
      "watch": "Answer length varies run to run, so compare speed, not total time.",
      "terms": [
        "token",
        "eval-rate"
      ],
      "measured": ""
    }
  ],
  "columns": [
    {
      "label": "When",
      "path": "when",
      "left": true
    },
    {
      "key": "model",
      "label": "Model",
      "path": "model",
      "left": true
    },
    {
      "key": "ctx",
      "label": "Ctx",
      "path": [
        "result.ctx_loaded",
        "run.ctx"
      ],
      "digits": 0
    },
    {
      "key": "tps",
      "label": "Speed tok/s",
      "path": "result.tps",
      "digits": 2
    },
    {
      "key": "ttft_ms",
      "label": "First word ms",
      "path": "result.ttft_ms",
      "digits": 0
    },
    {
      "key": "load_s",
      "label": "Load s",
      "path": "run.counters.load_s",
      "digits": 2
    },
    {
      "key": "mem_gb",
      "label": "Memory GB",
      "path": "result.mem_gb",
      "digits": 1
    },
    {
      "key": "gpu_pct",
      "label": "GPU %",
      "path": "result.gpu_pct",
      "digits": 0,
      "level": "gpu_pct"
    },
    {
      "key": "mem_free_pct",
      "label": "Free low %",
      "path": "result.mem_free_pct",
      "digits": 0,
      "level": "mem_free_pct"
    },
    {
      "key": "swap_mb",
      "label": "Swap MB",
      "path": "result.swap_mb",
      "digits": 0
    },
    {
      "key": "tokens",
      "label": "Tokens",
      "path": "run.counters.eval_count",
      "digits": 0
    },
    {
      "label": "Tag",
      "path": "tag",
      "left": true
    }
  ],
  "terms": {
    "eval-rate": "eval rate",
    "token": "token",
    "memory-bandwidth": "memory bandwidth",
    "prompt-eval-rate": "prompt eval rate",
    "kv-cache": "KV cache",
    "context-window": "context window",
    "sliding-window-attention": "sliding-window attention",
    "unified-memory": "unified memory",
    "model-family": "model family",
    "parameter": "parameter",
    "quantization": "quantization",
    "open-weight-model": "open-weight model"
  },
  "legend": [
    {
      "name": "Speed",
      "text": "is Ollama's own count: tokens written over the time spent writing them."
    },
    {
      "name": "First word",
      "text": "is measured on the wall clock and includes loading the model: thousands of ms when the model starts cold, tens when it is already in memory."
    },
    {
      "name": "GPU",
      "text": "below 100% means part of the model spilled to the CPU, which is slower."
    },
    {
      "name": "Free",
      "text": "is the memory the Mac has left for everything else."
    },
    {
      "name": "Swap",
      "text": "is memory written to disk; it carries over from earlier work, so watch whether it grows during a run."
    },
    {
      "name": "Thermal",
      "text": "none-recorded means macOS raised no warning; it is not a temperature."
    }
  ]
};