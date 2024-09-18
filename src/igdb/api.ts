import GLib from 'gi://GLib'
import fetch from '../lib/fetch.js'
import { Settings } from '../settings.js'

interface TwitchOauthToken {
  access_token: string
  expires_in: number
}

export interface IgdbSearchResult {
  game: IgdbGame
}

export interface IgdbGame {
  id: number
  cover?: { image_id: string, url: string }
  first_release_date: number
  involved_companies: IgdbInvolvedCompany[]
  name: string
  platforms?: number[]
  slug: string
  summary: string
}

interface IgdbInvolvedCompany {
  company: { name: string }
  developer: boolean
  publisher: boolean
}

interface SearchParams {
  platform?: number
}

export function igdbCoverUrl(imageId?: string, size: 'cover_small' | 'cover_big' = 'cover_big') {
  return imageId ? `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg` : null
}

export class IgdbApi {
  private settings!: Settings

  constructor(settings: Settings) {
    this.settings = settings
  }


  async authenticate() {
    const { igdbClientId, igdbClientSecret } = this.settings

    if (!igdbClientId || !igdbClientSecret) {
      return
    }

    const response = await fetch<TwitchOauthToken>({
      url: 'https://id.twitch.tv/oauth2/token',
      query: {
        client_id: igdbClientId,
        client_secret: igdbClientSecret,
        grant_type: 'client_credentials',
      },
      method: 'POST',
    })

    if (response.ok) {
      const token = await response.json()

      this.settings.igdbAccessToken = token.access_token

      const now = GLib.DateTime.new_now_local().to_unix()
      this.settings.igdbAccessTokenExpiration = now + token.expires_in
    }
  }

  async search(term: string, params: SearchParams = {}) {
    if (!this.isSettingsValid) {
      return []
    }

    if (this.isExpired) {
      await this.authenticate()
    }

    const { igdbAccessToken, igdbClientId } = this.settings

    const response = await fetch<IgdbGame[]>({
      url: 'https://api.igdb.com/v4/games',
      method: 'POST',
      headers: {
        'Client-ID': igdbClientId!,
        'Authorization': `Bearer ${igdbAccessToken}`
      },
      body: `
        fields name, slug, platforms, cover.url, cover.image_id, summary,
          first_release_date, game_modes.slug, genres.name, age_ratings.rating,
          age_ratings.category, involved_companies.company.name,
          involved_companies.developer, involved_companies.publisher;
        search "${term}";
        where version_parent = null ${params.platform ? `& platforms = [${params.platform}]` : ''};
      `
    })

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  get isSettingsValid(): boolean {
    const { igdbAccessToken, igdbClientId, igdbClientSecret } = this.settings

    return igdbAccessToken !== null && igdbClientId !== null && igdbClientSecret !== null
  }

  get isExpired(): boolean {
    const now = GLib.DateTime.new_now_local().to_unix()
    const expiresIn = this.settings.igdbAccessTokenExpiration

    return expiresIn > 0 && expiresIn < now
  }
}
