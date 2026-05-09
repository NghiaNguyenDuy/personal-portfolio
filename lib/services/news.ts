import { prisma } from "@/lib/prisma";
import { importActiveSources, type SourceImportResult } from "@/lib/services/source-ingestion";
import { generateSummaryForFilters } from "@/lib/services/summary-generation";

export interface NewsPipelineSummaryResult {
  topic: string;
  ok: boolean;
  summaryId: string | null;
  message: string;
}

export interface NewsPipelineResult {
  ok: boolean;
  message: string;
  imports: SourceImportResult[];
  importError: string | null;
  summaries: NewsPipelineSummaryResult[];
  failedTopics: string[];
  topicSlugs: string[];
}

export async function refreshContentPipeline(): Promise<NewsPipelineResult> {
  let importResults: SourceImportResult[] = [];
  let importError: string | null = null;

  try {
    importResults = await importActiveSources();
  } catch (error) {
    importError = error instanceof Error ? error.message : "Unable to import active sources.";
  }

  const topics = await prisma.topic.findMany({ where: { isTracked: true }, orderBy: { name: "asc" } });
  const summaryResults: NewsPipelineSummaryResult[] = [];

  for (const topic of topics) {
    try {
      const summaryId = await generateSummaryForFilters({ topicSlug: topic.slug });
      summaryResults.push({
        topic: topic.slug,
        ok: true,
        summaryId,
        message: "Summary generated."
      });
    } catch (error) {
      summaryResults.push({
        topic: topic.slug,
        ok: false,
        summaryId: null,
        message: error instanceof Error ? error.message : "Unable to generate summary."
      });
    }
  }

  const failedTopics = summaryResults.filter((summary) => !summary.ok).map((summary) => summary.topic);
  const ok = !importError && failedTopics.length === 0;
  const message = ok
    ? "News workflow completed."
    : [
        importError ? `Source import failed: ${importError}` : null,
        failedTopics.length ? `Summary generation failed for ${failedTopics.join(", ")}.` : null
      ]
        .filter(Boolean)
        .join(" ");

  return {
    ok,
    message,
    imports: importResults,
    importError,
    summaries: summaryResults,
    failedTopics,
    topicSlugs: topics.map((topic) => topic.slug)
  };
}
