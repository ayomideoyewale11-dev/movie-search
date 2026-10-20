const spinner = document.getElementById("spinner");
const resultsContainer = document.getElementById("genre-results");
const paginationContainer = document.getElementById("pagination");
const BASE_URL = "/api/omdb";
const OMDB_RESULTS_PER_PAGE = 10;
const DEFAULT_POSTER = "../imgs/image%20default.jpg";

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

async function fetchOmdb(url) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

async function searchByGenre(genre, page = 1) {
  try {
    localStorage.setItem("currentGenre", genre);
    localStorage.setItem("currentPage", String(page));
    spinner.style.display = "block";
    resultsContainer.innerHTML = "";
    paginationContainer.innerHTML = "";

    // OMDb only searches titles. The details request narrows those results by genre.
    const data = await fetchOmdb(
      `${BASE_URL}?s=${encodeURIComponent(genre)}&type=movie&page=${page}`,
    );
    if (data.Response !== "True") {
      resultsContainer.innerHTML = `<p>No results found: ${escapeHtml(data.Error)}</p>`;
      return;
    }

    const detailsList = await Promise.all(
      data.Search.map((movie) =>
        fetchOmdb(
          `${BASE_URL}?i=${encodeURIComponent(movie.imdbID)}`,
        ),
      ),
    );
    const matchingMovies = detailsList.filter(
      (movie) =>
        movie.Response === "True" &&
        movie.Genre?.toLowerCase().includes(genre.toLowerCase()),
    );

    resultsContainer.innerHTML = matchingMovies.length
      ? matchingMovies
          .map(
            (movie) => `
          <div class="genre-card"><div class="genre-movie-card">
            <a href="details.html?id=${encodeURIComponent(movie.imdbID)}" class="genre-detail">
              <img src="${escapeHtml(posterUrl(movie.Poster))}" alt="${escapeHtml(movie.Title)}" class="genre-poster" onerror="this.onerror=null;this.src='${DEFAULT_POSTER}'">
              <h3>${escapeHtml(movie.Title)}</h3>
            </a><p>⭐ ${escapeHtml(movie.imdbRating)}/10</p>
          </div></div>`,
          )
          .join("")
      : `<p>No ${escapeHtml(genre)} movies found on this page.</p>`;

    renderPagination(
      genre,
      page,
      Number(data.totalResults),
      matchingMovies.length,
      data.Search.length,
    );
  } catch (error) {
    console.error("Error fetching genre:", error);
    resultsContainer.innerHTML = `<p class="no-results">Something went wrong. Please try again.</p>`;
  } finally {
    spinner.style.display = "none";
  }
}

function renderPagination(genre, page, totalResults, matchCount, rawCount) {
  paginationContainer.innerHTML = "";
  const maxPages = Math.ceil(totalResults / OMDB_RESULTS_PER_PAGE);
  const addButton = (label, disabled, callback) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.disabled = disabled;
    if (!disabled) button.addEventListener("click", callback);
    paginationContainer.appendChild(button);
  };
  addButton("Previous", page === 1, () => searchByGenre(genre, page - 1));
  addButton("Next", page >= maxPages, () => searchByGenre(genre, page + 1));
  const pageInfo = document.createElement("span");
  pageInfo.textContent = ` Page ${page} — ${matchCount} genre matches from ${rawCount} search results `;
  paginationContainer.appendChild(pageInfo);
}

document.querySelectorAll("#genre-nav li").forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelectorAll("#genre-nav li")
      .forEach((li) => li.classList.remove("selected"));
    item.classList.add("selected");
    searchByGenre(item.dataset.genre, 1);
  });
});

window.addEventListener("load", () => {
  const genre = localStorage.getItem("currentGenre");
  const page = Number.parseInt(localStorage.getItem("currentPage"), 10) || 1;
  if (genre) searchByGenre(genre, page);
});
