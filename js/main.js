let particles = null;

function gameIntroPhase1() {
  document.getElementById("start-audio").play();

  // 1. Stop particles and start phase 2 when they have stopped
  let id = setInterval(function() {
    if (particles.pJS.particles.move.speed <= 0) {
      clearInterval(id);
      gameIntroPhase2();
    } else {
      particles.pJS.particles.move.speed = particles.pJS.particles.move.speed - 0.01
    }
  }, 10);

  // 2. Secretly replace start-game icon with standalone icon that will fly
  //    away from the menu and do the transform animation
  let startGame = document.getElementById("start-game");
  let sprite = document.getElementById("sprite-transform");
  let rect = startGame.getBoundingClientRect();

  sprite.style.position = "absolute";
  sprite.style.left = rect.left + "px";
  sprite.style.top = rect.top + "px";
  sprite.style.display = "block";
  startGame.style.display = "none";

  // 3. Prepare things so that the menu can be moved down out of the page
  let menu = document.getElementById("menu");
  let menuRect = menu.getBoundingClientRect();
  let menuTop = menuRect.top + 44;

  // menu.style.position = "absolute";
  menu.style.margin = "0px";
  menu.style.left = menuRect.left + "px";
  menu.style.top = menuTop + "px";

  particles.pJS.interactivity.events.onhover.enable = false;

  // 4. Display tutorial text
  setTimeout(function() {
    let tutorial_1 = document.getElementById("tutorial-1");
    let tutorial_2 = document.getElementById("tutorial-2");
    let tutorial_3 = document.getElementById("tutorial-3");
    let tutorial_4 = document.getElementById("tutorial-4");
    tutorial_1.style.display = "inline";

    setTimeout(function() {
      tutorial_1.style.display = "none";
      tutorial_2.style.display = "inline";

      setTimeout(function() {
        tutorial_2.style.display = "none";
        tutorial_3.style.display = "inline";

        setTimeout(function() {
          tutorial_3.style.display = "none";
          tutorial_4.style.display = "inline";
          
          setTimeout(function() {
            tutorial_4.style.display = "none";
          }, 4000);
        }, 4000);
      }, 4000);
    }, 4000);
  }, 7500);
}

function gameIntroPhase2() {
  // 1. Increase speed of particles
  let interval = setInterval(function() {
    if (particles.pJS.particles.move.speed <= -10) {
      clearInterval(interval);
    } else {
      particles.pJS.particles.move.speed = particles.pJS.particles.move.speed - 0.05
    }
  }, 10);

  // 2. Move the menu down and out of view (as if flying away from it)
  let menu = document.getElementById("menu");
  let menuTop = menu.getBoundingClientRect().top;

  let sprite = document.getElementById("sprite-transform");

  setTimeout(function() {
    let menuInterval = setInterval(function() {
      if (menu.style.height + menuTop > window.innerHeight) {
        clearInterval(menuInterval);
      } else {
        menuTop += 1;
        menu.style.top = menuTop + "px";
      }
    }, 1);

    let spriteTop = menu.getBoundingClientRect().top - 44;

    let spriteInterval = setInterval(function() {
      if (sprite.style.height + spriteTop > window.innerHeight / 2) {
        clearInterval(spriteInterval);
	// 3. Trigger the transform animation and next phase
        setTimeout(gameIntroPhase3, 1000);
      } else {
        spriteTop += 2;
        sprite.style.top = spriteTop + "px";
      }
    }, 10);
  }, 2000);
}

function gameIntroPhase3() {
  // 1. Play the ship transform animation
  let sprite = document.getElementById("sprite-transform");
  let position = 0;

  let intervalId = setInterval(function() {
    if (position < 660) {
      position += 44;
      sprite.style.backgroundPosition = `-${position}px 0px`;
    } else {
      clearInterval(intervalId);
      // 2. Start the game engine after the tutorial text has been shown
      setTimeout(function() {
        startGameEngine();
      }, 11000);
    }
  }, 130);
}

document.addEventListener("DOMContentLoaded", function () {
  particles = particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 100,
        "density": {
          "enable": true,
          "value_area": 500
        }
      },
      "color": {
        "value": ["#ffffff", "#DC143C"]
      },
      "shape": {
        "type": "edge",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 0
        }
      },
      "size": {
        "value": 2,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 4,
          "size_min": 1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": false
      },
      "move": {
        "enable": true,
        "speed": 2,
        "direction": "top",
        "random": true,
        "straight": true,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": false,
          // "rotateX": 600,
          // "rotateY": 600
        }
      }
    },
    "retina_detect": true,
    "interactivity": {
      "events": {
        "onhover": {
          "enable": false
        }
      }
    },
    // "interactivity": {
    //   "detect_on": "canvas",
    //   "events": {
    //     "onhover": {
    //       "enable": false,
    //       "mode": "bubble"
    //     },
    //     "onclick": {
    //       "enable": true,
    //       "mode": "repulse"
    //     },
    //     "resize": true
    //   },
    //   "modes": {
    //     "grab": {
    //       "distance": 400,
    //       "line_linked": {
    //         "opacity": 1
    //       }
    //     },
    //     "bubble": {
    //       "distance": 250,
    //       "size": 0,
    //       "duration": 2,
    //       "opacity": 0,
    //       "speed": 3
    //     },
    //     "repulse": {
    //       "distance": 400,particles
    //       "duration": 0.4
    //     },
    //     "push": {
    //       "particles_nb": 4
    //     },
    //     "remove": {
    //       "particles_nb": 2
    //     }
    //   }
    // }
  });

  // If we're on the /game page, start the particles out moving downwards
  if (window.location.pathname.indexOf('game') !== -1) {
    particles.pJS.particles.move.speed = -10;
  }

}, false);
