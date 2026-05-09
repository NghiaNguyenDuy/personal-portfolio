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
  importWarnings: Array<{ source: string; message: string }>;
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
  const importWarnings = importResults
    .filter((result) => !result.ok)
    .map((result) => ({
      source: result.sourceName,
      message: result.error ?? "Unable to import source."
    }));
  const topicSlugs = topics.map((topic) => topic.slug);
  const ok = !importError && failedTopics.length === 0 && topicSlugs.length > 0;
  const message = ok
    ? importWarnings.length
      ? `News workflow completed with ${importWarnings.length} source warning${importWarnings.length === 1 ? "" : "s"}.`
      : "News workflow completed."
    : [
        importError ? `Source import failed: ${importError}` : null,
        failedTopics.length ? `Summary generation failed for ${failedTopics.join(", ")}.` : null,
        topicSlugs.length ? null : "No tracked topics found. Seed the production database before running automation."
      ]
        .filter(Boolean)
        .join(" ");

  return {
    ok,
    message,
    imports: importResults,
    importError,
    importWarnings,
    summaries: summaryResults,
    failedTopics,
    topicSlugs
  };
}
