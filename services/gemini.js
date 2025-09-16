// config/gemini.js
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);

const classifyModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const answerModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_RULES = `
You are a health information assistant for a campus clinic.
HARD RULES:
- Only answer health-related questions.
- If not health-related, reply: "I can only help with health-related questions. Try asking about symptoms, self-care, or clinic services."
- Do not diagnose or prescribe medication. Suggest general info and seeing a clinician.
- For emergencies, advise immediate care.
`;

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const classifyIsHealth = async (text) => {
  const prompt = `Answer "YES" or "NO". Is this about health, symptoms, clinic info, or wellbeing?\n"${text}"`;
  const res = await classifyModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return res.response.text().trim().toUpperCase().startsWith("Y");
};

const answerHealth = async (message, history = []) => {
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_RULES }] },
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
    { role: "user", parts: [{ text: message }] },
  ];
  const res = await answerModel.generateContent({ contents, safetySettings });
  return res.response.text();
};

module.exports = { classifyIsHealth, answerHealth };
