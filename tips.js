import { db, collection, getDocs } from "./firebase.js";

const tipsContainer = document.getElementById("tipsContainer");

async function loadTips() {
  const snapshot = await getDocs(collection(db, "predictions"));

  tipsContainer.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    const card = document.createElement("section");
    card.className = "group-card";

    card.innerHTML = `
  <button class="tip-toggle">
    ${data.name}
  </button>

  <div class="tip-content">
    <div class="tips-list">
      ${matches.map(match => `
        <div class="tip-row">
          <span>
            ${match.flagA} ${match.teamA}
            vs
            ${match.flagB} ${match.teamB}
          </span>

          <strong>
            ${formatTip(data.predictions[match.id])}
          </strong>
        </div>
      `).join("")}
    </div>
  </div>
`;

    tipsContainer.appendChild(card);
  });
  document.querySelectorAll(".tip-toggle").forEach(button => {

  button.addEventListener("click", () => {

    const content = button.nextElementSibling;

    content.classList.toggle("open");

  });

});
}

function formatTip(tip) {
  if (tip === "draw") return "Oavgjort";
  return tip;
}

loadTips();