/**
 * LED Expo page script
 *
 * CONTENTS
 * 1. Element helpers and page state
 * 2. Interactive controls and object rendering
 * 3. Local media / saved settings
 * 4. Responsive and accessibility behavior
 */

(() => {
      "use strict";
      const player = document.getElementById("ledexpo-feature-video");
      const title = document.getElementById("ledexpo-video-description-title");
      const description = document.getElementById("ledexpo-video-description-text");
      const date = document.getElementById("ledexpo-video-date");
      const choices = Array.from(document.querySelectorAll(".ledexpo-video-choice"));
      if (!player || !title || !description || !date || choices.length === 0) return;
      choices.forEach((choice) => {
        choice.addEventListener("click", () => {
          choices.forEach((button) => button.setAttribute("aria-pressed", "false"));
          choice.setAttribute("aria-pressed", "true");
          player.src = choice.dataset.videoUrl;
          player.title = choice.dataset.videoTitle;
          title.textContent = choice.dataset.descriptionTitle;
          description.textContent = choice.dataset.descriptionText;
          date.dateTime = choice.dataset.descriptionDatetime;
          date.textContent = choice.dataset.descriptionDate;
        });
      });
    })();
