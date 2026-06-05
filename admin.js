import {
  db,
  doc,
  setDoc
} from "./firebase.js";

const ADMIN_PASSWORD = "admin123";

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");
const adminMatches = document.getElementById("adminMatches");
const adminGroups = document.getElementById("adminGroups");

loginBtn.addEventListener("click", () => {
  if (passwordInput.value === ADMIN_PASSWORD) {
    loginBox.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    renderAdminMatches();
    renderAdminGroups();
  } else {
    alert("Fel lösenord.");
  }
});

function renderAdminMatches() {
  adminMatches.innerHTML = "";

  matches.forEach(match => {
    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
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

      <button class="btn primary save-result" data-match="${match.id}">
        Spara resultat
      </button>
    `;

    adminMatches.appendChild(div);
  });

  document.querySelectorAll(".save-result").forEach(button => {
    button.addEventListener("click", async () => {
      const matchId = button.dataset.match;
      const selected = document.querySelector(`input[name="${matchId}"]:checked`);

      if (!selected) {
        alert("Välj ett resultat först.");
        return;
      }

    await setDoc(
        doc(db, "results", matchId),
        {
            result: selected.value,
            savedAt: new Date().toISOString()
        }
);

      alert("Resultatet sparades!");
    });
  });
}
function getGroups() {
  const groups = {};

  matches.forEach(match => {
    if (!groups[match.group]) {
      groups[match.group] = [];
    }

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

function renderAdminGroups() {
  const groups = getGroups();
  adminGroups.innerHTML = "";

  Object.keys(groups).forEach(groupName => {
    const teams = getTeamsInGroup(groups[groupName]);

    const card = document.createElement("section");
    card.className = "group-card";

    card.innerHTML = `
      <h3>${groupName}</h3>
      <p>Dra lagen till rätt slutordning.</p>

      <ul class="ranking-list admin-ranking-list" data-group="${groupName}">
        ${teams.map((team, index) => `
          <li class="ranking-item" draggable="true" data-team="${team.name}">
            <span class="rank-number">${index + 1}</span>
            <span>${team.flag} ${team.name}</span>
            <span class="drag-handle">☰</span>
          </li>
        `).join("")}
      </ul>

      <button class="btn primary save-group-result" data-group="${groupName}">
        Spara ${groupName}
      </button>
    `;

    adminGroups.appendChild(card);
  });

  activateDragAndDrop();

  document.querySelectorAll(".save-group-result").forEach(button => {
    button.addEventListener("click", async () => {
      const groupName = button.dataset.group;
      const list = document.querySelector(
        `.admin-ranking-list[data-group="${groupName}"]`
      );

      const order = [...list.querySelectorAll(".ranking-item")].map(item => {
        return item.dataset.team;
      });

      await setDoc(
        doc(db, "groupResults", groupName),
        {
          order,
          savedAt: new Date().toISOString()
        }
      );

      alert(`${groupName} sparades!`);
    });
  });
}