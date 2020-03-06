let particles = null;

function game_intro_phase_1() {
  // 1. Stop particles and start phase 2 when they have stopped
  let id = setInterval(function() {
    if (particles.pJS.particles.move.speed <= 0) {
      clearInterval(id);
      game_intro_phase_2();
    } else {
      particles.pJS.particles.move.speed = particles.pJS.particles.move.speed - 0.01
    }
  }, 10);
  
  // 2. Secretly replace start-game icon with standalone icon that will fly
  //    away from the menu and do the transform animation
  let start_game = document.getElementById("start-game");
  let sprite = document.getElementById("sprite-transform");
  let rect = start_game.getBoundingClientRect();
  
  sprite.style.position = "absolute";
  sprite.style.left = rect.left + "px";
  sprite.style.top = rect.top + "px";
  sprite.style.display = "block";
  start_game.style.display = "none";
  
  // 3. Prepare things so that the menu can be flown away from
  let menu = document.getElementById("menu");
  let menu_rect = menu.getBoundingClientRect();
  let menu_top = menu_rect.top + 55;

  // menu.style.position = "absolute";
  menu.style.margin = "0px";
  menu.style.left = menu_rect.left + "px";
  menu.style.top = menu_top + "px";
  
  particles.pJS.interactivity.events.onhover.enable = false;
}

function game_intro_phase_2() {
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
  let menu_top = menu.getBoundingClientRect().top;

  let sprite = document.getElementById("sprite-transform");

  setTimeout(function() {
    let menu_interval = setInterval(function() {
      if (menu.style.height + menu_top > window.innerHeight) {
        clearInterval(menu_interval);
      } else {
        menu_top += 1;
        menu.style.top = menu_top + "px";
      }
    }, 2);

    let sprite_top = menu.getBoundingClientRect().top - 55;

    let sprite_interval = setInterval(function() {
      if (sprite.style.height + sprite_top > window.innerHeight / 2) {
        clearInterval(sprite_interval);
        setTimeout(play_transform, 1000);
      } else {
        sprite_top += 2;
        sprite.style.top = sprite_top + "px";
      }
    }, 10);
  }, 2000);
}

function play_transform() {
  let sprite = document.getElementById("sprite-transform");
  let position = 0;
  
  let transform_interval = setInterval(function() {
    if (position < 825) {
      position += 55;
    } else {
      position = 825;
      clearInterval(transform_interval);
      // setup_physics();
      start_game_engine();
    }
  
    sprite.style.backgroundPosition = `-${position}px 0px`;
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
      // "opacity": {
      //   "value": 1,
      //   "random": true,
      //   "anim": {
      //     "enable": true,
      //     "speed": 1,
      //     "opacity_min": 0,
      //     "sync": false
      //   }
      // },
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
}, false);