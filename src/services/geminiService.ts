import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export const analyzePhysicsState = async (params: {
  gainLoss: number;
  coupling: number;
  latticeSize: number;
  phase: number;
}) => {
  try {
    const prompt = `Analyze the current state of a Non-Hermitian Topo-Photonic lattice. 
    Lattice: ${params.latticeSize}x${params.latticeSize}
    Gain/Loss: ${params.gainLoss.toFixed(2)}
    Coupling: ${params.coupling.toFixed(2)}
    Modulation Phase: ${params.phase.toFixed(2)}
    
    The user is observing the 2026 "Skin-Effect Protection" breakthrough. Explain if the current configuration supports unidirectional edge states or if the system has undergone a PT-symmetry breaking transition. 
    Keep it technical and grounded in 2026 photonics terminology. Reference the Non-Hermitian Skin Effect (NHSE) specifically.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior researcher in Computational Photonics. Provide brief, expert analysis of lattice stability and topological invariants. Max 2-3 sentences.",
      }
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Real-time analysis stream interrupted. Check connectivity.";
  }
};
