import {
  db,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "./firebase.js";

const LOCK_DATE = new Date("2026-06-11T00:00:00");
const now = new Date();

if (now >= LOCK_DATE) {
  document.body.innerHTML = `
    <header class="topbar">
      <a href="index.html" class="logo">VM-Tips 2026</a>
    </header>

    <main class="page">
      <section class="intro-card">
        <h1>Tipsningen är stängd</h1>
        <p>Det går inte längre att skicka in nya tips eftersom VM har börjat.</p>
        <a href="leaderboard.html" class="btn primary">Se poängställning</a>
      </section>
    </main>
  `;
}
const container = document.getElementById("matchesContainer");
const form = document.getElementById("predictionForm");
const progressText = document.getElementById("progressText");

function getGroups() {
  const groups = {};

  matches.forEach(match => {
    if (!groups[match.group]) groups[match.group] = [];
    groups[match.group].push(match);
  });

  return groups;
}

function getTeamsInGroup(groupMatches) {
  const teams = [];

  groupMatches.forEach(match => {
    if (!teams.some(team => team.name === match.teamA)) {
      teams.push({ name: match.teamA, flag: match.flagA });
    }

    if (!teams.some(team => team.name === match.teamB)) {
      teams.push({ name: match.teamB, flag: match.flagB });
    }
  });

  return teams;
}

function renderMatches() {
  const groups = getGroups();
  container.innerHTML = "";

  Object.keys(groups).forEach(groupName => {
    const groupCard = document.createElement("section");
    groupCard.className = "group-card";

    groupCard.innerHTML = `<h2 class="group-title">${groupName}</h2>`;

    groups[groupName].forEach(match => {
      const matchCard = document.createElement("article");
      matchCard.className = "match-card";

      matchCard.innerHTML = `
        <div class="match-teams">
          <span>${match.flagA} ${match.teamA}</span>
          <span>vs</span>
          <span>${match.flagB} ${match.teamB}</span>
        </div>

        <div class="choice-row">
          <label>
            <input type="radio" name="${match.id}" value="${match.teamA}">
            ${match.teamA}
          </label>

          <label>
            <input type="radio" name="${match.id}" value="draw">
            Oavgjort
          </label>

          <label>
            <input type="radio" name="${match.id}" value="${match.teamB}">
            ${match.teamB}
          </label>
        </div>
      `;

      groupCard.appendChild(matchCard);
    });

    const teams = getTeamsInGroup(groups[groupName]);

    const rankingBox = document.createElement("div");
    rankingBox.className = "ranking-box";
    rankingBox.innerHTML = `
      <h3>Tippa slutordning i ${groupName}</h3>
      <p>Dra lagen upp och ner. Laget högst upp slutar 1:a i gruppen.</p>
      <ul class="ranking-list" data-group="${groupName}">
        ${teams.map((team, index) => `
          <li class="ranking-item" draggable="true" data-team="${team.name}">
            <span class="rank-number">${index + 1}</span>
            <span>${team.flag} ${team.name}</span>
            <div class="rank-buttons">
                <button type="button" class="move-up">↑</button>
                <button type="button" class="move-down">↓</button>
            </div>
          </li>
        `).join("")}
      </ul>
    `;

    groupCard.appendChild(rankingBox);
    container.appendChild(groupCard);
  });

  activateDragAndDrop();
}

function activateDragAndDrop() {
  const lists = document.querySelectorAll(".ranking-list");

  lists.forEach(list => {
    let draggedItem = null;

    list.addEventListener("dragstart", event => {
      draggedItem = event.target;
      event.target.classList.add("dragging");
    });

    list.addEventListener("dragend", event => {
      event.target.classList.remove("dragging");
      draggedItem = null;
      updateRankNumbers(list);
    });

    list.addEventListener("dragover", event => {
      event.preventDefault();

      const afterElement = getDragAfterElement(list, event.clientY);

      if (afterElement == null) {
        list.appendChild(draggedItem);
      } else {
        list.insertBefore(draggedItem, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".ranking-item:not(.dragging)")
  ];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }

    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateRankNumbers(list) {
  const items = list.querySelectorAll(".ranking-item");

  items.forEach((item, index) => {
    item.querySelector(".rank-number").textContent = index + 1;
  });
}

function updateProgress() {
  const answered = matches.filter(match => {
    return document.querySelector(`input[name="${match.id}"]:checked`);
  }).length;

  progressText.textContent = `${answered}/${matches.length} matcher ifyllda`;
}

document.addEventListener("change", updateProgress);

form.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("playerName").value.trim();

  if (!name) {
    alert("Skriv in ditt namn först.");
    return;
  }

  const nameCheck = query(
    collection(db, "predictions"),
    where("nameLower", "==", name.toLowerCase())
  );

  const existingNames = await getDocs(nameCheck);

  if (!existingNames.empty) {
    alert("Det namnet finns redan.");
    return;
  }

  const predictions = {};
  const groupRankings = {};

  for (const match of matches) {
    const selected = document.querySelector(`input[name="${match.id}"]:checked`);

    if (!selected) {
      alert("Du måste fylla i alla matcher.");
      return;
    }

    predictions[match.id] = selected.value;
  }

  document.querySelectorAll(".ranking-list").forEach(list => {
    const groupName = list.dataset.group;

    const order = [...list.querySelectorAll(".ranking-item")].map(item => {
      return item.dataset.team;
    });

    groupRankings[groupName] = order;
  });

  try {
    await addDoc(collection(db, "predictions"), {
        name,
        nameLower: name.toLowerCase(),
        predictions,
        groupRankings,
        submittedAt: new Date().toISOString()
});

    alert("Tipset har skickats!");
    form.reset();
    updateProgress();

  } catch (error) {
    console.error(error);
    alert("Något gick fel när tipset skulle sparas.");
  }
});
document.addEventListener("click", event => {
  if (event.target.classList.contains("move-up")) {
    const item = event.target.closest(".ranking-item");
    const previous = item.previousElementSibling;

    if (previous) {
      item.parentNode.insertBefore(item, previous);
      updateRankNumbers(item.parentNode);
    }
  }

  if (event.target.classList.contains("move-down")) {
    const item = event.target.closest(".ranking-item");
    const next = item.nextElementSibling;

    if (next) {
      item.parentNode.insertBefore(next, item);
      updateRankNumbers(item.parentNode);
    }
  }
});
renderMatches();
updateProgress();