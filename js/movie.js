const BASE_URL = "/api/omdb";
const DEFAULT_POSTER = "../imgs/image%20default.jpg";
const searchInput = document.getElementById("search-input");
const searchButton = document.querySelector(".search-btn");
const spinner = document.getElementById("spinner");
const container = document.getElementById("movies");
const autocompleteContainer = document.getElementById("autocomplete-container");
let debounceTimer;
let autocompleteController;
let searchController;

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

function posterUrl(poster) {
  return poster && poster !== "N/A" ? poster : DEFAULT_POSTER;
}

async function fetchOmdb(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  clearTimeout(debounceTimer);
  autocompleteController?.abort();
  if (query.length < 2) {
    autocompleteContainer.style.display = "none";
    return;
  }

  debounceTimer = setTimeout(async () => {
    const controller = new AbortController();
    autocompleteController = controller;
    try {
      const data = await fetchOmdb(
        `${BASE_URL}?s=${encodeURIComponent(query)}`,
        controller.signal,
      );
      // Do not render an older response after the user has typed a newer query.
      if (searchInput.value.trim() !== query || data.Response !== "True")
        return;
      autocompleteContainer.innerHTML = data.Search.slice(0, 5)
        .map(
          (movie) =>
            `<div data-id="${escapeHtml(movie.imdbID)}">${escapeHtml(movie.Title)} (${escapeHtml(movie.Year)})</div>`,
        )
        .join("");
      autocompleteContainer.style.display = "block";
    } catch (error) {
      if (error.name !== "AbortError")
        console.error("Autocomplete request failed:", error);
      autocompleteContainer.style.display = "none";
    }
  }, 300);
});

autocompleteContainer.addEventListener("click", (event) => {
  const item = event.target.closest("[data-id]");
  if (item)
    window.location.href = `details.html?id=${encodeURIComponent(item.dataset.id)}`;
});

async function searchMovie(title) {
  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;
  try {
    spinner.style.display = "block";
    container.innerHTML = "";
    const data = await fetchOmdb(
      `${BASE_URL}?s=${encodeURIComponent(title)}`,
      controller.signal,
    );
    if (data.Response !== "True") {
      container.innerHTML = `<p class="no-results">No results found: ${escapeHtml(data.Error)}</p>`;
      return;
    }

    const detailsList = await Promise.all(
      data.Search.map((movie) =>
        fetchOmdb(
          `${BASE_URL}?i=${encodeURIComponent(movie.imdbID)}`,
          controller.signal,
        ),
      ),
    );
    const cards = detailsList
      .filter((movie) => movie.Response === "True")
      .map(
        (movie) => `
        <div class="movie-card">
          <a href="details.html?id=${encodeURIComponent(movie.imdbID)}" class="movie-card-link">
            <img src="${escapeHtml(posterUrl(movie.Poster))}" alt="${escapeHtml(movie.Title)}" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_POSTER}'" class="poster">
            <h3 class="movie-title">${escapeHtml(movie.Title)}</h3>
          </a>
          <p class="movie-rating">Rating: ⭐ ${escapeHtml(movie.imdbRating)}/10</p>
        </div>`,
      )
      .join("");
    container.innerHTML =
      cards || `<p class="no-results">No displayable results found.</p>`;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Movie search failed:", error);
      container.innerHTML = `<p class="no-results">Something went wrong. Please try again.</p>`;
    }
  } finally {
    if (searchController === controller) spinner.style.display = "none";
  }
}

function handleSearch() {
  const keyword = searchInput.value.trim();
  if (!keyword) return;
  autocompleteContainer.style.display = "none";
  window.location.href = `index.html?search=${encodeURIComponent(keyword)}`;
}

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSearch();
  }
});
searchButton.addEventListener("click", handleSearch);

const searchParam = new URLSearchParams(window.location.search).get("search");
if (searchParam) {
  searchInput.value = searchParam;
  searchMovie(searchParam);
}
