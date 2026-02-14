import { cache, CacheTTL } from './cache';

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

const RECENT_GAMES_KEY = 'steam_recent';

interface SteamPlayer {
  gameextrainfo?: string;
  gameid?: string;
}

interface SteamRecentGame {
  name: string;
  appid: number;
  playtime_2weeks?: number;
}

interface SteamGameResult {
  name: string;
  gameId: string;
  imageUrl: string;
  isPlaying: boolean;
  playTime2Weeks?: number;
}

export async function getCurrentGame(): Promise<SteamGameResult | null> {
  if (!STEAM_API_KEY || !STEAM_ID) {
    console.warn('Steam credentials not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      console.error(`Steam API returned status: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error(`Steam API returned non-JSON content type: ${contentType}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data?.response?.players?.[0]) {
      console.warn('No player data found in Steam API response');
      return null;
    }

    const player = data.response.players[0] as SteamPlayer;

    if (player.gameextrainfo && player.gameid) {
      return {
        name: player.gameextrainfo,
        gameId: player.gameid,
        imageUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${player.gameid}/header.jpg`,
        isPlaying: true,
      };
    }

    const cachedRecent = cache.get<SteamGameResult>(RECENT_GAMES_KEY);
    if (cachedRecent) {
      return cachedRecent;
    }

    return await fetchRecentGames();
  } catch (error) {
    console.error('Error fetching Steam data:', error);
    return null;
  }
}

async function fetchRecentGames(): Promise<SteamGameResult | null> {
  try {
    const response = await fetch(
      `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      console.error(`Steam Recent Games API returned status: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error(`Steam Recent Games API returned non-JSON content type: ${contentType}`);
      return null;
    }

    const recentGames = await response.json();

    if (recentGames?.response?.games?.[0]) {
      const topGame = recentGames.response.games[0] as SteamRecentGame;
      const result: SteamGameResult = {
        name: topGame.name,
        gameId: topGame.appid.toString(),
        imageUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${topGame.appid}/header.jpg`,
        isPlaying: false,
        playTime2Weeks: topGame.playtime_2weeks,
      };

      cache.set(RECENT_GAMES_KEY, result, CacheTTL.MEDIUM);

      return result;
    }

    return null;
  } catch (error) {
    console.error('Error fetching recent Steam games:', error);
    return null;
  }
}