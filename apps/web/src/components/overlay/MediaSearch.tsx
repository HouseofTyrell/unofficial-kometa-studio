import { useState } from 'react';
import { TmdbService, TmdbMovie, TmdbTVShow } from '../../services/tmdb.service';
import styles from './MediaSearch.module.css';

export interface MediaSearchProps {
  tmdbService: TmdbService;
  mediaType: 'movie' | 'tv';
  onMediaSelect: (media: TmdbMovie | TmdbTVShow) => void;
}

export function MediaSearch({ tmdbService, mediaType, onMediaSelect }: MediaSearchProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<(TmdbMovie | TmdbTVShow)[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      let searchResults;
      if (mediaType === 'movie') {
        searchResults = await tmdbService.searchMovie(query);
      } else {
        searchResults = await tmdbService.searchTV(query);
      }

      setResults(searchResults.slice(0, 10)); // Limit to 10 results

      if (searchResults.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectMedia = (media: TmdbMovie | TmdbTVShow) => {
    onMediaSelect(media);
    setResults([]); // Clear results after selection
    setQuery(''); // Clear search query
  };

  const getPosterUrl = (posterPath: string | null) => {
    return tmdbService.getPosterUrl(posterPath, 'w185');
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Search for ${mediaType === 'movie' ? 'movies' : 'TV shows'}...`}
          className={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className={styles.searchButton}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {results.length > 0 && (
        <div className={styles.results}>
          <h4 className={styles.resultsTitle}>Search Results</h4>
          <div className={styles.resultsList}>
            {results.map((media) => {
              const title = 'title' in media ? media.title : media.name;
              const releaseDate =
                'release_date' in media ? media.release_date : media.first_air_date;
              const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

              return (
                <div
                  key={media.id}
                  className={styles.resultItem}
                  onClick={() => handleSelectMedia(media)}
                >
                  <div className={styles.posterContainer}>
                    {media.poster_path ? (
                      <img
                        src={getPosterUrl(media.poster_path) || ''}
                        alt={title}
                        className={styles.poster}
                      />
                    ) : (
                      <div className={styles.noPoster}>No Image</div>
                    )}
                  </div>
                  <div className={styles.mediaInfo}>
                    <div className={styles.mediaTitle}>
                      {title} ({year})
                    </div>
                    <div className={styles.mediaOverview}>
                      {media.overview
                        ? media.overview.slice(0, 100) + (media.overview.length > 100 ? '...' : '')
                        : 'No description available'}
                    </div>
                    <div className={styles.mediaRating}>⭐ {media.vote_average.toFixed(1)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
