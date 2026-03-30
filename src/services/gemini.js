function buildParts(textPrompt, contextFilesBase64 = [], assignmentFileBase64 = null) {
  const parts = [];
  
  // Attach Context PDFs
  if (contextFilesBase64 && contextFilesBase64.length > 0) {
    contextFilesBase64.forEach((f) => {
      if (f) parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
    });
  }

  // Attach Assignment PDF
  if (assignmentFileBase64) {
    parts.push({ inlineData: { mimeType: assignmentFileBase64.mimeType, data: assignmentFileBase64.data } });
  }

  // Attach Text Prompt last
  parts.push({ text: textPrompt });
  
  return parts;
}

export async function generateQuestions(apiKey, contextText, contextFilesBase64, assignmentFileBase64) {
  const prompt = `
You are an expert academic evaluator. Your task is to generate exactly 1 "AI-resistant" question based on the provided course context and the student's submitted assignment. 
This question will be asked verbally to the student to verify that they actually wrote the assignment and deeply understand it. 

CRITICAL CONSTRAINTS:
1. Match the complexity of the questions strictly to the student's own vocabulary and the course level. Do not formulate overly sophisticated or academic questions that might confuse a diligent student under time pressure.
2. Focus purely on the CORE arguments, main methodology, or personal reflections present in their assignment. Do not quiz them on obscure minutiae.
3. Keep the questions focused on their own decision-making process (e.g., "Why did you choose to argue for X instead of Y here?").

Context/Syllabus instructions:
${contextText || "No additional text context provided. See attached PDFs if any."}

Generate exactly 1 question. Return the response STRICTLY as a JSON array answering this format:
[
  { "id": 1, "text": "Question 1..." }
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: buildParts(prompt, contextFilesBase64, assignmentFileBase64) }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to call Gemini API");
  }

  const data = await response.json();
  const resultText = data.candidates[0].content.parts[0].text;
  return JSON.parse(resultText);
}

export async function evaluateSubmission(config, studentAnswers, contextFilesBase64, assignmentFileBase64) {
  const { apiKey, contextText, questions } = config;

  let qnaText = "";
  questions.forEach((q) => {
    qnaText += `\nQuestion: ${q.text}\nStudent Live Answer (Voice Transcribed): ${studentAnswers[q.id] || "No Answer Given"}\n`;
  });

  const prompt = `
You are an expert academic evaluator. Your task is to detect the likelihood that a student used AI to generate their submitted assignment.
You are provided with:
1. The Syllabus / Course Context (provided context text and attached PDFs).
2. The Written Assignment the student submitted (attached PDF).
3. A specific question designed to verify understanding, along with the student's live verbal answer.

CRITICAL CONSTRAINTS FOR FAIRNESS - ASSUME HUMAN BY DEFAULT:
1. DEFAULT TO LOW PROBABILITY: Always assume the student is human. If the submitted assignment itself is simple and the verbal answers are simple but broadly relevant, the probability is strictly LOW. Give the student the absolute benefit of the doubt.
2. PREVENT FALSE POSITIVES: A student giving a very short, simple, clumsy, or nervous answer under a 10-minute exam timer is completely normal human behavior. Do NOT flag this as AI use. 
3. FOCUS ON "CORE ALIGNMENT", NOT POLISH: Evaluate if their spoken thought process roughly aligns with the core idea of their written work. If it does, score LOW.
4. UNDENIABLE PROOF REQUIRED FOR HIGH: Only assign a HIGH probability if there is extreme, undeniable proof of deception—for example, the written paper uses postgraduate-level theories that the student verbally proves they have absolutely zero comprehension of.

Context / Syllabus text:
${contextText || "No context text provided"}

Live Q&A Validation:
${qnaText}

Return your response strictly as a JSON object matching this schema:
{
  "probability": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "A paragraph explaining the rationale behind your score. Acknowledge if human limitations (nerves/memory) played a role.",
  "discrepancies": [
    "List point 1 of any major differences found",
    "List point 2..."
  ]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: buildParts(prompt, contextFilesBase64, assignmentFileBase64) }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to call Gemini API");
  }

  const data = await response.json();
  const resultText = data.candidates[0].content.parts[0].text;
  
  return JSON.parse(resultText);
}
