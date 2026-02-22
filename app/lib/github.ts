import type { GithubResponse, GithubRepository } from '../types';
import { cache, CacheTTL } from './cache';

const CACHE_KEY = 'github_repos';
const GITHUB_USERNAME = 'rustdevlad';

export async function getPinnedRepos() {
  const cached = cache.get<ReturnType<typeof formatRepos>>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const query = `
    query {
      user(login: "${GITHUB_USERNAME}") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              stargazerCount
              primaryLanguage {
                name
              }
              repositoryTopics(first: 10) {
                nodes {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('GitHub token not configured');
      return [];
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('GitHub API error:', response.status);
      return [];
    }

    const { data } = (await response.json()) as GithubResponse;
    
    if (!data?.user?.pinnedItems?.nodes) {
      console.warn('Unexpected GitHub response structure');
      return [];
    }

    const repos = formatRepos(data.user.pinnedItems.nodes);

    cache.set(CACHE_KEY, repos, CacheTTL.LONG);

    return repos;
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return [];
  }
}

function formatRepos(nodes: GithubRepository[]) {
  return nodes.map((repo) => ({
    name: repo.name,
    description: repo.description,
    html_url: repo.url,
    stargazers_count: repo.stargazerCount,
    language: repo.primaryLanguage?.name ?? null,
    topics: repo.repositoryTopics.nodes.map(node => node.topic.name),
  }));
}