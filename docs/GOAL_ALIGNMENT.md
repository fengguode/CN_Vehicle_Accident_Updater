# vNext goal alignment review

Reviewed 2026-09-25 against the goal of a usable, continuously updated database of publicly reported road incidents in mainland China. Records are leads until reviewed; ADAS involvement is optional.

| Area | Current behavior | Gap or limit |
| --- | --- | --- |
| Source scope | The scheduled updater accepts only direct Weibo URLs found by two site-restricted index feeds. Broad Google News article feeds are disabled. Authorized platform exports enter through a separate JSONL inbox. | Google News remains a discovery transport for Weibo. Index coverage and freshness are incomplete; the job is daily, not real-time. |
| Weibo | Resolved links must be on `weibo.com`; a bounded enrichment step can read available post text and keeps the longer usable content. Each scheduled run logs timestamp coverage, apparent feed age, enrichment count, and median content length. The authenticated CLI remains opt-in. | Login walls and index delay can leave only short snippets. Feed age is not proven original-post discovery delay; public-page enrichment does not guarantee a full post body. |
| Xiaohongshu and other social sources | The collector schema and import pipeline accept direct HTTPS posts with full content from authorized exports. | There is no unattended Xiaohongshu discovery adapter. Add one through the existing collector-to-JSONL contract when an authorized access method is available. |
| Relevance model | Traffic-specific votes train a versioned SVM on the stored title and complete content. Chinese word segmentation, character bigrams, and length-normalized term weights replace short character chunks. | Existing old-model weights must be retrained from votes to use the new representation. A feed that supplies only a description cannot provide full article text. |
| Review and presentation | Reports retain source links, provenance, verification status, and community relevance votes. The web workspace presents reports before account and admin tools. | Community relevance estimates fit to this database; it does not verify the event, severity, or cause. |

## Next source integrations

1. Review several scheduled runs of Weibo quality metrics. If the index exposes trustworthy original-post timestamps, measure actual discovery delay; otherwise report only apparent feed age. Compare enrichment and content-length trends before deciding whether the official authenticated CLI should be activated.
2. Add an authorized Xiaohongshu collector or export producer that emits the existing JSONL schema. Preserve the direct post URL, original text, publication time, and access failure reason.
3. The one-shot `npm run vnext:update-public` command already supports repeated collection with deduplication; cadence is set by Windows Task Scheduler, currently configured as daily in `scripts/install-vnext-tasks.ps1`. Changing the live task is separate operational work. After reviewing several `source_quality` logs, choose a bounded interval that the index and authorized access can support. A shorter interval still cannot guarantee near-real-time posts because index arrival is outside this project.
