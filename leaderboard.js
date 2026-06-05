import {
  db,
  collection,
  getDocs
} from "./firebase.js";

const leaderboardContainer =
  document.getElementById("leaderboardContainer");

async function loadLeaderboard() {

  const predictionsSnapshot =
    await getDocs(collection(db, "predictions"));

  const resultsSnapshot =
    await getDocs(collection(db, "results"));

  const results = {};

  resultsSnapshot.forEach(doc => {
    results[doc.id] = doc.data().result;
  });

  const players = [];

  predictionsSnapshot.forEach(doc => {

    const data = doc.data();

    let points = 0;

    for (const matchId in data.predictions) {

      if (
        results[matchId] &&
        results[matchId] === data.predictions[matchId]
      ) {
        points++;
      }
    }

    players.push({
      name: data.name,
      points
    });

  });

  players.sort((a, b) => b.points - a.points);

  leaderboardContainer.innerHTML = `
    <div class="leaderboard-list">
      ${players.map((player, index) => `
        <div class="leaderboard-row">
          <span class="placement">
            ${getPlacementIcon(index)}
          </span>

          <span class="player-name">
            ${player.name}
          </span>

          <span class="player-points">
            ${player.points} p
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function getPlacementIcon(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

loadLeaderboard();