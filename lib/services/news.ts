import { prisma } from "@/lib/prisma";
import { importActiveSources } from "@/lib/services/source-ingestion";
import { generateSummaryForFilters } from "@/lib/services/summary-generation";

export async function refreshContentPipeline() {
  const importResults = await importActiveSources();
  const topics = await prisma.topic.findMany({ where: { isTracked: true }, orderBy: { name: "asc" } });
  const summaryResults: Array<{ topic: string; summaryId: string | null }> = [];

  for (const topic of topics) {
    try {
      const summaryId = await generateSummaryForFilters({ topicSlug: topic.slug });
      summaryResults.push({ topic: topic.slug, summaryId });
    } catch {
      summaryResults.push({ topic: topic.slug, summaryId: null });
    }
  }

  return {
    imports: importResults,
    summaries: summaryResults
  };
}
