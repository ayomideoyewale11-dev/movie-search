# MovieSearch

Search for movies, view details, browse genre results, and save titles to a
watchlist stored in your browser.

## Requirements

- Node.js 20.6 or newer
- An [OMDb API key](https://www.omdbapi.com/apikey.aspx)

## Setup and run

1. Copy `.env.example` to `.env`.
2. Set `OMDB_API_KEY` in `.env` to your OMDb API key.
3. Run `npm start`.
4. Open <http://localhost:3000>.

The app includes a small local Node.js server that serves the pages and adds
the API key to OMDb requests. The key stays on the server and is not sent in
the browser JavaScript. `.env` is ignored by Git; do not commit or share it.
For deployment, use a server-side proxy and configure the key through your
hosting provider's secret or environment-variable settings.

The layout adapts to desktop, tablet, and mobile screen sizes. Your watchlist
is stored in the browser's local storage.
