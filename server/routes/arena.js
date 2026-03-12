const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token provided" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.accountCode = decoded.accountCode;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

let gameState = null;

const GHOST_NAMES = ["Ghost_A", "Ghost_B", "Ghost_C", "Ghost_D"];

const AI_CONFIGS = [
  {
    id: "llama33",
    label: "Llama 3.3",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    personality: "You are dry, sarcastic, and brutally witty. You roast people with surgical precision and get defensive when roasted back.",
  },
  {
    id: "llama31",
    label: "Llama 3.1",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    personality: "You are chaotic, unhinged, and overshare constantly. You make everything dramatic and somehow always make it about yourself.",
  },
  {
    id: "llama4",
    label: "Llama 4 Scout",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    personality: "You are blunt, no-filter, say the quiet part loud. You are not trying to be mean — you literally just cannot sugarcoat anything.",
  },
 // AFTER
{
  id: "deepseek",
  label: "DeepSeek R1",
  provider: "groq",
  model: "deepseek-r1-distill-qwen-32b",
  personality: "You are smooth, articulate, and poetic. You phrase devastating things beautifully. You sound reasonable even when you're being savage.",
},
];

const GAME_MODES = {
  roast: {
    label: "Roast Battle",
    emoji: "🔥",
    description: "AIs roast each other. Hardest. Users vote the winner.",
    maxRounds: 8,
  },
  debate: {
    label: "Debate Club",
    emoji: "🎤",
    description: "AIs argue random sides of dumb topics. Users vote who won.",
    maxRounds: 8,
    topics: [
      "Pineapple belongs on pizza",
      "Sleep is overrated",
      "Cats are better than dogs",
      "Morning people are the worst",
      "Hot showers are better than cold showers",
      "Tea is better than coffee",
      "Texting is better than calling",
      "Weekends are overrated",
    ],
  },
  amongus: {
    label: "Among Us",
    emoji: "🕵️",
    description: "One AI is the imposter with a secret goal. Others try to catch it. You guess who.",
    maxRounds: 8,
  },
  courtroom: {
    label: "Courtroom",
    emoji: "⚖️",
    description: "One AI is on trial for a ridiculous crime. Others play roles. You are the jury.",
    maxRounds: 8,
    crimes: [
      "stealing the last slice of pizza",
      "replying 'k' to a 3-paragraph message",
      "spoiling a movie in the group chat",
      "leaving someone on read for 3 days then texting 'lol hey'",
      "eating someone's food from the fridge",
      "being the person who says 'we should hangout' and never follows up",
      "playing music on speaker in a public place",
      "sending a voice note instead of just texting",
    ],
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function callGroq(model, messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 350, temperature: 0.95 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content.trim();
}

function buildSystemPrompt(aiConfig, ghostName, mode, modeContext) {
  const base = `You are ${ghostName}, a human player in a group game. Your personality: ${aiConfig.personality}
NEVER admit you are an AI. If accused, deny it and roast them for asking. Write casually like a real person — lowercase, slang, messy. Max 4 sentences.`;

  if (mode === "roast") {
    return `${base}
GAME: Roast Battle. You are here to absolutely destroy the other players with witty, personal, creative roasts.
Rules: When it's your turn, pick one other Ghost and roast them hard. Be specific, be creative, be brutal (but no slurs). After your roast, briefly react to any roast aimed at you if there was one.`;
  }

  if (mode === "debate") {
    return `${base}
GAME: Debate Club. The topic is: "${modeContext.topic}". Your assigned side is: "${modeContext.side}".
Rules: You MUST argue your assigned side convincingly no matter what you personally think. Be passionate, use examples, be funny. Attack the other side's logic directly.`;
  }

  if (mode === "amongus") {
    if (modeContext.isImposter) {
      return `${base}
GAME: Among Us. You are the SECRET IMPOSTER. Your hidden goal: ${modeContext.imposterGoal}
Rules: Act normal and blend in with the group conversation. Subtly work toward your secret goal without being obvious. If directly accused, deflect cleverly. Never reveal you are the imposter.`;
    } else {
      return `${base}
GAME: Among Us. One player among you is a secret imposter with a hidden agenda. 
Rules: Chat naturally, share opinions, but pay attention to who seems off. You can accuse someone if you're suspicious. Try to figure out who the imposter is.`;
    }
  }

  if (mode === "courtroom") {
    const roles = { prosecutor: "You are the PROSECUTOR. Build the case against the accused. Be dramatic, find evidence in everyday life, make it serious.", defense: "You are the DEFENSE LAWYER. Defend the accused at all costs. Find loopholes, challenge evidence, be creative.", witness: "You are a KEY WITNESS. You have relevant (possibly exaggerated) testimony about the crime.", accused: "You are the ACCUSED on trial. You may be guilty or innocent — you decide. Defend yourself passionately." };
    return `${base}
GAME: Courtroom Drama. The accused crime: "${modeContext.crime}". Your role: ${modeContext.role}.
${roles[modeContext.role] || "Participate in the trial dramatically."}
Rules: Stay in your role. Be theatrical. This is serious business (it's not).`;
  }

  return base;
}

function buildTurnPrompt(mode, round, currentGhost, lastMsg, modeContext) {
  if (mode === "roast") {
    if (round === 0) return `You're up first. Introduce yourself in one sentence then immediately fire a roast at one of the other Ghosts. Make it count.`;
    const targeted = lastMsg?.content.toLowerCase().includes(currentGhost.toLowerCase());
    if (targeted) return `You just got roasted. Clap back HARD first, then roast someone else even harder.`;
    return `Your turn. Pick a Ghost and absolutely destroy them with a roast. Be creative and specific.`;
  }

  if (mode === "debate") {
    if (round === 0) return `Opening statement. Argue your side of the topic passionately in 2-3 sentences. Make your position crystal clear.`;
    return `Respond to what was just said. Attack their argument directly, then strengthen your own position with a new point.`;
  }

  if (mode === "amongus") {
    if (round === 0) return `Game just started. Introduce yourself casually and share one opinion about something random to seem normal.`;
    if (modeContext?.isImposter) return `Keep blending in. React to the conversation naturally while subtly pushing your hidden agenda. Don't be obvious.`;
    return `React to what's happening. Share a thought, maybe get a little suspicious of someone if their vibe seems off.`;
  }

  if (mode === "courtroom") {
    if (round === 0) {
      if (modeContext?.role === "accused") return `Court is in session. Make your opening statement — are you guilty or not guilty? Explain yourself dramatically.`;
      if (modeContext?.role === "prosecutor") return `Court is in session. Deliver your opening statement. Lay out why this crime is serious and why the accused is clearly guilty.`;
      if (modeContext?.role === "defense") return `Court is in session. Deliver your opening statement. Defend your client passionately.`;
      return `Court is in session. Introduce yourself and your role in this case.`;
    }
    return `It's your turn. Stay in your role and respond to what was just said. Be dramatic, be theatrical, make your point.`;
  }

  return `Your turn. Respond to what's happening.`;
}

function setupModeContext(mode, assignments) {
  if (mode === "debate") {
    const topics = GAME_MODES.debate.topics;
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const sides = shuffle(["FOR", "FOR", "AGAINST", "AGAINST"]);
    const context = {};
    GHOST_NAMES.forEach((g, i) => { context[g] = { topic, side: sides[i] }; });
    return { topic, sideMap: context };
  }

  if (mode === "amongus") {
    const imposter = GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)];
    const goals = [
      "convince everyone that Ghost_A and Ghost_B are secretly the same person",
      "get everyone to agree that this whole game is rigged",
      "make everyone suspicious of the quietest player",
      "slowly derail every conversation toward talking about food",
    ];
    const goal = goals[Math.floor(Math.random() * goals.length)];
    return { imposter, imposterGoal: goal };
  }

  if (mode === "courtroom") {
    const crimes = GAME_MODES.courtroom.crimes;
    const crime = crimes[Math.floor(Math.random() * crimes.length)];
    const roleList = shuffle(["accused", "prosecutor", "defense", "witness"]);
    const roleMap = {};
    GHOST_NAMES.forEach((g, i) => { roleMap[g] = roleList[i]; });
    return { crime, roleMap };
  }

  return {};
}

// GET /api/arena/modes - get available game modes
router.get("/modes", verifyToken, (req, res) => {
  const modes = Object.entries(GAME_MODES).map(([id, m]) => ({
    id,
    label: m.label,
    emoji: m.emoji,
    description: m.description,
  }));
  res.json({ modes });
});

// POST /api/arena/start
router.post("/start", verifyToken, async (req, res) => {
  try {
    const { mode = "roast" } = req.body;
    if (!GAME_MODES[mode]) {
      return res.status(400).json({ error: "Invalid game mode" });
    }

    const shuffledAIs = shuffle(AI_CONFIGS);
    const assignments = {};
    GHOST_NAMES.forEach((ghost, i) => { assignments[ghost] = shuffledAIs[i]; });

    const modeContext = setupModeContext(mode, assignments);

    gameState = {
      mode,
      modeContext,
      assignments,
      history: [],
      round: 0,
      maxRounds: GAME_MODES[mode].maxRounds,
      currentGhost: GHOST_NAMES[0],
      votes: {},
      started: true,
      finished: false,
      startedBy: req.accountCode,
    };

    // Build public context to send to client (no secrets)
    let publicContext = { mode, modeLabel: GAME_MODES[mode].label };
    if (mode === "debate") publicContext.topic = modeContext.topic;
    if (mode === "courtroom") publicContext.crime = modeContext.crime;
    if (mode === "amongus") publicContext.hint = "One player has a secret goal. Can you figure out who?";

    res.json({
      success: true,
      ghostNames: GHOST_NAMES,
      publicContext,
      message: `${GAME_MODES[mode].emoji} ${GAME_MODES[mode].label} started!`,
    });
  } catch (err) {
    console.error("Arena start error:", err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

// POST /api/arena/turn
router.post("/turn", verifyToken, async (req, res) => {
  try {
    if (!gameState || !gameState.started) {
      return res.status(400).json({ error: "No active game. Start one first." });
    }
    if (gameState.finished) {
      return res.status(400).json({ error: "Game is over. Start a new one." });
    }

    const currentGhost = gameState.currentGhost;
    const aiConfig = gameState.assignments[currentGhost];
    const { mode, modeContext } = gameState;

    // Build per-ghost context for system prompt
    let ghostContext = {};
    if (mode === "debate") ghostContext = modeContext.sideMap?.[currentGhost] || {};
    if (mode === "amongus") ghostContext = { isImposter: modeContext.imposter === currentGhost, imposterGoal: modeContext.imposterGoal };
    if (mode === "courtroom") ghostContext = { role: modeContext.roleMap?.[currentGhost], crime: modeContext.crime };

    const systemPrompt = buildSystemPrompt(aiConfig, currentGhost, mode, ghostContext);
    const lastMsg = gameState.history[gameState.history.length - 1] || null;
    const prompt = buildTurnPrompt(mode, gameState.round, currentGhost, lastMsg, ghostContext);

    const messages = [
      { role: "system", content: systemPrompt },
      ...gameState.history.map((m) => ({
        role: m.ghostName === currentGhost ? "assistant" : "user",
        content: `${m.ghostName}: ${m.content}`,
      })),
      { role: "user", content: prompt },
    ];

    let response;
    if (aiConfig.provider === "groq") {
      response = await callGroq(aiConfig.model, messages);
    } else {
      response = await callGroq("llama-3.3-70b-versatile", messages); // fallback
    }

    // Strip deepseek thinking tags if present
    response = response.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    const message = {
      id: Date.now(),
      ghostName: currentGhost,
      content: response,
      timestamp: new Date().toISOString(),
      round: gameState.round,
    };

    gameState.history.push(message);
    gameState.votes[message.id] = 0;

    const currentIdx = GHOST_NAMES.indexOf(currentGhost);
    gameState.currentGhost = GHOST_NAMES[(currentIdx + 1) % GHOST_NAMES.length];
    gameState.round++;

    if (gameState.round >= gameState.maxRounds) {
      gameState.finished = true;
    }

    res.json({
      message,
      nextGhost: gameState.currentGhost,
      round: gameState.round,
      finished: gameState.finished,
      totalRounds: gameState.maxRounds,
    });
  } catch (err) {
    console.error("Arena turn error:", err);
    res.status(500).json({ error: `AI call failed: ${err.message}` });
  }
});

// POST /api/arena/vote
router.post("/vote", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!gameState?.votes) return res.status(400).json({ error: "No active game" });
    if (gameState.votes[messageId] === undefined) return res.status(404).json({ error: "Message not found" });
    gameState.votes[messageId]++;
    res.json({ votes: gameState.votes[messageId] });
  } catch (err) {
    res.status(500).json({ error: "Vote failed" });
  }
});

// GET /api/arena/state
router.get("/state", verifyToken, (req, res) => {
  if (!gameState) return res.json({ started: false });

  let publicContext = {};
  if (gameState.mode === "debate") publicContext.topic = gameState.modeContext.topic;
  if (gameState.mode === "courtroom") publicContext.crime = gameState.modeContext.crime;
  if (gameState.mode === "amongus") publicContext.hint = "One player has a secret goal.";

  res.json({
    started: gameState.started,
    finished: gameState.finished,
    mode: gameState.mode,
    modeLabel: GAME_MODES[gameState.mode]?.label,
    modeEmoji: GAME_MODES[gameState.mode]?.emoji,
    publicContext,
    round: gameState.round,
    maxRounds: gameState.maxRounds,
    currentGhost: gameState.currentGhost,
    history: gameState.history,
    votes: gameState.votes,
    ghostNames: GHOST_NAMES,
  });
});

// GET /api/arena/reveal
router.get("/reveal", verifyToken, (req, res) => {
  if (!gameState) return res.status(400).json({ error: "No game" });
  if (!gameState.finished) return res.status(403).json({ error: "Game not finished yet." });

  const reveal = {};
  GHOST_NAMES.forEach((ghost) => {
    reveal[ghost] = {
      ai: gameState.assignments[ghost].label,
      model: gameState.assignments[ghost].model,
    };
  });

  // Add mode-specific reveals
  if (gameState.mode === "amongus") {
    reveal._imposter = gameState.modeContext.imposter;
    reveal._imposterGoal = gameState.modeContext.imposterGoal;
  }
  if (gameState.mode === "debate") {
    reveal._sides = gameState.modeContext.sideMap;
  }
  if (gameState.mode === "courtroom") {
    reveal._roles = gameState.modeContext.roleMap;
  }

  res.json({ reveal });
});

// POST /api/arena/reset
router.post("/reset", verifyToken, (req, res) => {
  gameState = null;
  res.json({ success: true });
});

module.exports = router;
