import { config } from '../../core/config';
import log from '../../core/logger';
import { SiteNotesRequest, SiteNotesResponse } from './schema';

export async function processSiteNotes(input: SiteNotesRequest): Promise<SiteNotesResponse> {
  try {
    const response = await fetch(`${config.AI_SERVICE_URL}/api/site-notes/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      log.error('AI service site-notes process failed', {
        status: response.status.toString(),
      });
      return {
        success: false,
        punchList: [],
        checklist: [],
        materialList: [],
        error: 'Site notes AI service failed',
      };
    }

    return (await response.json()) as SiteNotesResponse;
  } catch (error) {
    log.error('AI service site-notes process error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      punchList: [],
      checklist: [],
      materialList: [],
      error: 'Site notes AI service unavailable',
    };
  }
}