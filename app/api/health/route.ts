import { jsonResponse, CacheControl } from '../../lib/response';
import { validateEnv } from '../../lib/env';

export const runtime = 'edge';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
}

const startTime = Date.now();

export async function GET() {
  const checks: HealthStatus['checks'] = [];

  const envCheck = validateEnv();
  checks.push({
    name: 'environment',
    status: envCheck.valid ? 'pass' : 'fail',
    message: envCheck.valid ? 'All required env vars set' : `Missing: ${envCheck.missing.join(', ')}`,
  });

  try {
    const response = await fetch('https://api.github.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    checks.push({
      name: 'external_connectivity',
      status: response.ok ? 'pass' : 'fail',
      message: response.ok ? 'External APIs reachable' : `Status: ${response.status}`,
    });
  } catch {
    checks.push({
      name: 'external_connectivity',
      status: 'fail',
      message: 'Failed to reach external APIs',
    });
  }

  const allPassed = checks.every(c => c.status === 'pass');
  const somePassed = checks.some(c => c.status === 'pass');

  const status: HealthStatus = {
    status: allPassed ? 'healthy' : somePassed ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  return jsonResponse(status, {
    status: allPassed ? 200 : 503,
    cache: CacheControl.NO_CACHE,
  });
}


