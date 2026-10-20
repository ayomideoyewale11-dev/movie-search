const BASE_URL = "/api/omdb";
const DEFAULT_POSTER = "../imgs/image%20default.jpg";
const spinner = document.getElementById("spinner");
const backBtn = document.querySelector(".back-btn");
const watchlistButton = document.querySelector(".add-to-watchlist");
const detailsContainer = document.getElementById("movie-details");
const imdbID = new URLSearchParams(window.location.search).get("id");

function escapeHtml(value) {
  return String(value ?? "N/A").replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function getWatchlist() {
  try {
    const savedWatchlist = JSON.parse(localStorage.getItem("watchlist"));
    return Array.isArray(savedWatchlist) ? savedWatchlist : [];
  } catch {
    return [];
  }
}

function posterUrl(poster) {
  return poster && poster !== "N/A" ? poster : DEFAULT_POSTER;
}

async function getMovieDetails(id) {
  const response = await fetch(
    `${BASE_URL}?i=${encodeURIComponent(id)}&plot=full`,
  );
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  const movie = await response.json();
  if (movie.Response !== "True")
    throw new Error(movie.Error || "Movie not found");
  return movie;
}

function addToWatchlist(movie) {
  const watchlist = getWatchlist();
  if (!watchlist.some((item) => item.imdbID === movie.imdbID)) {
    watchlist.push(movie);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }
  watchlistButton.textContent = "✔ Added to Watchlist";
  watchlistButton.disabled = true;
}

async function loadMovieDetails(id) {
  try {
    spinner.style.display = "block";
    backBtn.style.display = "none";
    watchlistButton.style.display = "none";

    const movie = await getMovieDetails(id);
    const poster = `<img src="${escapeHtml(posterUrl(movie.Poster))}" alt="${escapeHtml(movie.Title)}" class="detail-poster" onerror="this.onerror=null;this.src='${DEFAULT_POSTER}'">`;

    detailsContainer.innerHTML = `
      <div class="movie-info">
        <div class="movie-poster-title">${poster}<h2 class="detail-title">${escapeHtml(movie.Title)}</h2></div>
        <p><strong>Year:</strong> ${escapeHtml(movie.Year)}</p>
        <p><strong>Genre:</strong> ${escapeHtml(movie.Genre)}</p>
        <p class="detail-type"><strong>Type:</strong> ${escapeHtml(movie.Type)}</p>
        <p><strong>Actors:</strong> ${escapeHtml(movie.Actors)}</p>
        <p><strong>Language:</strong> ${escapeHtml(movie.Language)}</p>
        <p><strong>Country:</strong> ${escapeHtml(movie.Country)}</p>
        <p><strong>Runtime:</strong> ${escapeHtml(movie.Runtime)}</p>
        <p><strong>Rated:</strong> ${escapeHtml(movie.Rated)}</p>
        <p><strong>Released:</strong> ${escapeHtml(movie.Released)}</p>
        ${movie.Type === "series" && movie.totalSeasons ? `<p><strong>Seasons:</strong> ${escapeHtml(movie.totalSeasons)}</p>` : ""}
        <p><strong>Plot:</strong> ${escapeHtml(movie.Plot)}</p>
        <p><strong>Rating:</strong> ⭐ ${escapeHtml(movie.imdbRating)} /10</p>
      </div>`;

    if (getWatchlist().some((item) => item.imdbID === movie.imdbID)) {
      watchlistButton.textContent = "✔ Added to Watchlist";
      watchlistButton.disabled = true;
    } else {
      watchlistButton.disabled = false;
      watchlistButton.addEventListener("click", () => addToWatchlist(movie), {
        once: true,
      });
    }
    watchlistButton.style.display = "block";
  } catch (error) {
    console.error("Unable to load movie details:", error);
    detailsContainer.innerHTML = `<p class="no-results">Unable to load this movie. Please try again.</p>`;
  } finally {
    spinner.style.display = "none";
    backBtn.style.display = "block";
  }
}

if (detailsContainer) {
  if (imdbID) loadMovieDetails(imdbID);
  else
    detailsContainer.innerHTML = `<p class="no-results">No movie selected.</p>`;
}

function goBack() {
  window.history.back();
}
