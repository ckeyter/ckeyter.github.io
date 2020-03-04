let particles = null;

const INPUTS = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPS_LOCK: 20,
  ESCAPE: 27,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40,
  INSERT: 45,
  DELETE: 46,
  KEY_0: 48,
  KEY_1: 49,
  KEY_2: 50,
  KEY_3: 51,
  KEY_4: 52,
  KEY_5: 53,
  KEY_6: 54,
  KEY_7: 55,
  KEY_8: 56,
  KEY_9: 57,
  KEY_A: 65,
  KEY_B: 66,
  KEY_C: 67,
  KEY_D: 68,
  KEY_E: 69,
  KEY_F: 70,
  KEY_G: 71,
  KEY_H: 72,
  KEY_I: 73,
  KEY_J: 74,
  KEY_K: 75,
  KEY_L: 76,
  KEY_M: 77,
  KEY_N: 78,
  KEY_O: 79,
  KEY_P: 80,
  KEY_Q: 81,
  KEY_R: 82,
  KEY_S: 83,
  KEY_T: 84,
  KEY_U: 85,
  KEY_V: 86,
  KEY_W: 87,
  KEY_X: 88,
  KEY_Y: 89,
  KEY_Z: 90,
  LEFT_META: 91,
  RIGHT_META: 92,
  SELECT: 93,
  NUMPAD_0: 96,
  NUMPAD_1: 97,
  NUMPAD_2: 98,
  NUMPAD_3: 99,
  NUMPAD_4: 100,
  NUMPAD_5: 101,
  NUMPAD_6: 102,
  NUMPAD_7: 103,
  NUMPAD_8: 104,
  NUMPAD_9: 105,
  MULTIPLY: 106,
  ADD: 107,
  SUBTRACT: 109,
  DECIMAL: 110,
  DIVIDE: 111,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUM_LOCK: 144,
  SCROLL_LOCK: 145,
  SEMICOLON: 186,
  EQUALS: 187,
  COMMA: 188,
  DASH: 189,
  PERIOD: 190,
  FORWARD_SLASH: 191,
  GRAVE_ACCENT: 192,
  OPEN_BRACKET: 219,
  BACK_SLASH: 220,
  CLOSE_BRACKET: 221,
  SINGLE_QUOTE: 222
};

/* sweetScroll load */
document.addEventListener("DOMContentLoaded", function () {
  // const sweetScroll = new SweetScroll({/* some options */});

  /* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
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
    "retina_detect": true
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
    //       "distance": 400,
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
  
  // setup_physics();
  // meh();
}, false);

function meh() {
  // get canvas context
  var ctx = document.getElementById('game-canvas').getContext('2d');
  // load image
  
  var image = document.getElementById('meow');
  ctx.drawImage(image, 0, 0, 11, 11, 0, 0, 11, 11);
  // var image = new Image();
  // image.src = '/images/logo.png';
  // image.onload = function () {
  //     // draw the image into the canvas
  //     ctx.drawImage(image, 0, 0);
  // }
}

function start_game_phase_1() {
  // 1. Stop particles and start phase 2 when they have stopped
  let id = setInterval(function() {
    if (particles.pJS.particles.move.speed <= 0) {
      clearInterval(id);
      start_game_phase_2();
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
  sprite.style.visibility = "visible";
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
  let body = document.getElementsByTagName("body")[0];
  body.style.overflow = "hidden";
}

function start_game_phase_2() {
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
        // activate_controls();
        
        let position = 0;
        
        let transform_interval = setInterval(function() {
          if (position < 825) {
            position += 55;
          } else {
            position = 825;
            clearInterval(transform_interval);
          }
        
          sprite.style.backgroundPosition = `-${position}px 0px`;
        }, 100);
      } else {
        sprite_top += 1;
        sprite.style.top = sprite_top + "px";
      }
    }, 10);
  }, 2000);
  
  
}

function setup_physics() {
  // module aliases
  var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Events = Matter.Events,
    Bodies = Matter.Bodies;

  // create an engine
  var engine = Engine.create();

  var canvas = document.getElementById("game-canvas");
  var game_div = document.getElementById("game");
  game_div.style.display = "block";
  
  var render = Render.create({
    // element: game_div,
    canvas: canvas,
    engine: engine,
    options: {
      width: 45,
      height: 90,
      pixelRatio: 1,
      background: '#000',
      // wireframeBackground: '#000',
      enabled: true,
      wireframes: false,
      // showVelocity: true,
      // showAngleIndicator: true,
      showCollisions: true
    }
  });
  
  engine.world.gravity.y = 0;
  
  //add the walls
  var offset = 5;
  World.add(engine.world, [
    Bodies.rectangle(400, -offset, 800 + 2 * offset, 50, {
      isStatic: true
    }),
    Bodies.rectangle(400, 600 + offset, 800 + 2 * offset, 50, {
      isStatic: true
    }),
    Bodies.rectangle(800 + offset, 300, 50, 600 + 2 * offset, {
      isStatic: true
    }),
    Bodies.rectangle(-offset, 300, 50, 600 + 2 * offset, {
      isStatic: true
    })
  ]);
  
  //add the player
  // var player = Bodies.circle(100, 100, 25, {
  //   density: 0.001,
  //   friction: 0.7,
  //   frictionStatic: 0,
  //   frictionAir: 0.01,
  //   restitution: 0.5,
  //   ground: false,
  // });
  var player = Bodies.rectangle(100, 100, 9, 9, {
    render: {
      strokeStyle: '#ffffff',
      lineWidth: 1,
      sprite: {
        texture: '/images/logo.png',
        xScale: 1,
        yScale: 1
      }
    }
  });

  //populate world
  World.add(engine.world, player);

  //looks for key presses and logs them
  var keys = [];
  document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
  });
  document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
  });
  
  //main engine update loop
  const MOVE_SPEED = 0.3;
  
  Events.on(engine, "beforeTick", function(event) {
    if (keys[INPUTS.UP_ARROW] || keys[INPUTS.KEY_W]) {
      Matter.Body.setVelocity(player, {
        x: player.velocity.x,
        y: player.velocity.y - MOVE_SPEED,
      });
    }
    else if (keys[INPUTS.DOWN_ARROW] || keys[INPUTS.KEY_S]) {
      Matter.Body.setVelocity(player, {
        x: player.velocity.x,
        y: player.velocity.y + MOVE_SPEED,
      });
    }
    
    if (keys[INPUTS.RIGHT_ARROW] || keys[INPUTS.KEY_D]) {
      Matter.Body.setVelocity(player, {
        x: player.velocity.x + MOVE_SPEED,
        y: player.velocity.y,
      });
    }
    else if (keys[INPUTS.LEFT_ARROW] || keys[INPUTS.KEY_A]) {
      Matter.Body.setVelocity(player, {
        x: player.velocity.x - MOVE_SPEED,
        y: player.velocity.y,
      });
    }
  });
  
  // run the engine
  Engine.run(engine);

  // run the renderer
  Render.run(render);
}

function activate_controls() {
  let player = document.getElementById("player");
  let rect = player.getBoundingClientRect();
  let left = rect.left;
  let top = rect.top;

  document.addEventListener("keydown", function(event) {
    if (event.keyCode == 37) {
      left -= 3;
      player.style.left = left + "px";
    } else if (event.keyCode == 39) {
      left += 3;
      player.style.left = left + "px";
    }
  });
}
