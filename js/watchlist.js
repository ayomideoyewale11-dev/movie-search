const WATCHLIST_KEY = "watchlist";
const DEFAULT_POSTER = "../imgs/image%20default.jpg";

function getWatchlist() {
  try {
    const savedWatchlist = JSON.parse(localStorage.getItem(WATCHLIST_KEY));
    return Array.isArray(savedWatchlist) ? savedWatchlist : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value ?? "N/A").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function posterUrl(poster) {
  return poster && poster !== "N/A" ? poster : DEFAULT_POSTER;
}

function loadWatchlist() {
  const spinner = document.getElementById("spinner");
  const container = document.getElementById("watchlist-container");
  const watchlistTitle = document.querySelector(".watchlist-title");
  const backSearchBtn = document.querySelector(".back-search-btn");
  spinner.style.display = "block";
  container.innerHTML = "";

  const watchlist = getWatchlist();
  if (!watchlist.length) {
    container.innerHTML = `<p class="watchlist-empty">Your watchlist is empty.</p>`;
  } else {
    container.innerHTML = watchlist.map((movie) => `
      <div class="watchlist-movie-card">
        <a href="details.html?id=${encodeURIComponent(movie.imdbID)}" class="movie-card-link">
          <div class="watchlist-poster-info">
            <img src="${escapeHtml(posterUrl(movie.Poster))}" alt="${escapeHtml(movie.Title)}" class="watchlist-img" onerror="this.onerror=null;this.src='${DEFAULT_POSTER}'">
            <h3 class="watchlist-info">${escapeHtml(movie.Title)} (${escapeHtml(movie.Year)})</h3>
          </div>
        </a>
        <p>⭐ ${escapeHtml(movie.imdbRating)}/10</p>
        <button class="remove-btn" data-id="${escapeHtml(movie.imdbID)}">Remove From Watchlist</button>
      </div>`).join("");
  }

  spinner.style.display = "none";
  watchlistTitle.style.display = "block";
  backSearchBtn.style.display = "block";
}

document.getElementById("watchlist-container").addEventListener("click", (event) => {
  const button = event.target.closest(".remove-btn");
  if (!button) return;
  const watchlist = getWatchlist().filter((movie) => movie.imdbID !== button.dataset.id);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  loadWatchlist();
});

loadWatchlist();
