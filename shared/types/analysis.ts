export interface AnalysisOutput {
  pontosFortes: string[];
  areasMelhoria: string[];
  recomendacoes: string[];
  scoreGeral: number;
  adequacaoMercado: number;
  potencialCrescimento: number;
  resumo: string;
  respostasMentoria?: string[];
  planoDesenvolvimento?: string[];
}

export interface AnalysisRequest {
  resumeText: string;
  jobDescription?: string;
  currentSituation?: string;
  mentorshipQuestions?: string;
}
