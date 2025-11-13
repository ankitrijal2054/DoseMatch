export const config = {
  rxnorm: {
    baseUrl:
      import.meta.env.PUBLIC_RXNORM_BASE_URL ||
      "https://rxnav.nlm.nih.gov/REST",
  },
  fda: {
    baseUrl:
      import.meta.env.PUBLIC_FDA_NDC_BASE_URL ||
      "https://api.fda.gov/drug/ndc.json",
  },
  app: {
    mode: import.meta.env.PUBLIC_APP_MODE || "demo",
  },
  functions: {
    baseUrl:
      import.meta.env.PUBLIC_FUNCTIONS_URL ||
      "https://us-central1-dosematch.cloudfunctions.net",
  },
};
