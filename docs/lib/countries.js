// Stands in for a server in the "options from a server" demos of combobox, autocomplete and select: every answer
// takes 700ms, and `dropNetwork()` makes every request started in the next two seconds fail.
const COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "Colombia",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Iceland",
  "India",
  "Indonesia",
  "Ireland",
  "Italy",
  "Japan",
  "Kenya",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Peru",
  "Poland",
  "Portugal",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Uruguay",
  "Vietnam",
].map((name) => ({ code: name.toLowerCase().replaceAll(" ", "-"), name }));

let downUntil = 0;

export function dropNetwork() {
  downUntil = Date.now() + 2000;
}

function answer(compute) {
  const down = Date.now() < downUntil;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (down) reject(new Error("The server couldn't be reached."));
      else resolve(compute());
    }, 700);
  });
}

/** The countries whose name contains `query`, ignoring case. */
export function searchCountries(query) {
  const q = query.trim().toLowerCase();
  return answer(() => COUNTRIES.filter((country) => country.name.toLowerCase().includes(q)));
}

/** Every country. */
export function loadCountries() {
  return answer(() => COUNTRIES);
}
