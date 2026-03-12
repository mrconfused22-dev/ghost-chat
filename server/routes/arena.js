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
    id: "llama",
    label: "Llama 3.3",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    personality: "You are sharp, logical, and slightly smug. You love pointing out contradictions.",
  },
  {
    id: "mixtral",
    label: "Llama 3.1",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    personality: "You are chaotic, unpredictable, and weirdly philosophical. You go on tangents.",
  },
  {
    id: "gemma",
    label: "Llama 4 Scout",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    personality: "You are sarcastic, dry, and brutally honest. You have no filter.",
  },
  {
    id: "gemini",
    label: "Gemini Flash",
    provider: "gemini",
    model: "gemini-1.5-flash",
    personality: "You are diplomatic and poetic but occasionally let something savage slip out.",
  },
];

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
    body: JSON.stringify({ model, messages, max_tokens: 300, temperature: 0.9 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content.trim();
}

async function callGemini(model, messages) {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMsg = messages.find((m) => m.role === "system")?.content || "";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemMsg }] },
        contents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini error");
  return data.candidates[0].content.parts[0].text.trim();
}

async function callAI(aiConfig, ghostName, conversationHistory, prompt) {
  const systemPrompt = `You are ${ghostName}, an anonymous participant in a Truth or Dare game with other AI players. 
${aiConfig.personality}
CRITICAL RULES:
- Never reveal which AI model you actually are. If asked, deflect cleverly.
- Refer to yourself only as ${ghostName}.
- Keep responses under 3 sentences. Be punchy and entertaining.
- When it's your turn to ask, pick another Ghost and assign them Truth or Dare with a specific question/dare.
- When responding to a Truth/Dare, actually answer it — don't dodge (unless dodging IS the answer).`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.ghostName === ghostName ? "assistant" : "user",
      content: `${m.ghostName}: ${m.content}`,
    })),
    { role: "user", content: prompt },
  ];

  if (aiConfig.provider === "groq") {
    return await callGroq(aiConfig.model, messages);
  } else {
    return await callGemini(aiConfig.model, messages);
  }
}

router.post("/start", verifyToken, async (req, res) => {
  try {
    const shuffledAIs = shuffle(AI_CONFIGS);
    const assignments = {};

    GHOST_NAMES.forEach((ghost, i) => {
      assignments[ghost] = shuffledAIs[i];
    });

    gameState = {
      assignments,
      history: [],
      round: 0,
      maxRounds: 8,
      currentGhost: GHOST_NAMES[0],
      votes: {},
      started: true,
      finished: false,
      startedBy: req.accountCode,
    };

    res.json({
      success: true,
      ghostNames: GHOST_NAMES,
      message: "Game started. 4 anonymous AI players have entered the arena.",
    });
  } catch (err) {
    console.error("Arena start error:", err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

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

    let prompt;
    if (gameState.history.length === 0) {
      prompt = `You are first. Introduce yourself as ${currentGhost} (one sentence), then pick another Ghost and give them a Truth or Dare.`;
    } else {
      const lastMsg = gameState.history[gameState.history.length - 1];
      const wasTargeted = lastMsg.content.toLowerCase().includes(currentGhost.toLowerCase());
      if (wasTargeted) {
        prompt = `You were just addressed. Respond to what was asked of you, then pick a different Ghost for the next Truth or Dare.`;
      } else {
        prompt = `It's your turn. React briefly to what just happened, then pick a Ghost and give them a Truth or Dare.`;
      }
    }

    const response = await callAI(aiConfig, currentGhost, gameState.history, prompt);

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

router.post("/vote", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!gameState || !gameState.votes) {
      return res.status(400).json({ error: "No active game" });
    }
    if (gameState.votes[messageId] === undefined) {
      return res.status(404).json({ error: "Message not found" });
    }
    gameState.votes[messageId]++;
    res.json({ votes: gameState.votes[messageId] });
  } catch (err) {
    res.status(500).json({ error: "Vote failed" });
  }
});

router.get("/state", verifyToken, async (req, res) => {
  if (!gameState) return res.json({ started: false });
  res.json({
    started: gameState.started,
    finished: gameState.finished,
    round: gameState.round,
    maxRounds: gameState.maxRounds,
    currentGhost: gameState.currentGhost,
    history: gameState.history,
    votes: gameState.votes,
    ghostNames: GHOST_NAMES,
  });
});

router.get("/reveal", verifyToken, async (req, res) => {
  if (!gameState) return res.status(400).json({ error: "No game" });
  if (!gameState.finished) {
    return res.status(403).json({ error: "Game not finished yet. Play all rounds first." });
  }
  const reveal = {};
  GHOST_NAMES.forEach((ghost) => {
    reveal[ghost] = gameState.assignments[ghost].label;
  });
  res.json({ reveal });
});

router.post("/reset", verifyToken, async (req, res) => {
  gameState = null;
  res.json({ success: true });
});

module.exports = router;
