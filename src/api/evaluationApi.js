import apiClient from "./apiClient.js";

export const runAutoEvaluation = async (attemptId) => {
  const response = await apiClient.post("/api/teacher/evaluate-attempt", { attemptId });
  return response.data;
};
