export const formatLighthouseReportForLog = (lighthouseReport) => {
  const scores = {}
  Object.keys(lighthouseReport.categories).forEach((name) => {
    scores[name] = lighthouseReport.categories[name].score
  })
  return JSON.stringify(scores, null, "  ")
}
