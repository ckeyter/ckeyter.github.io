// Tiles are square so this is used for width and height
const TILE_SIZE = 55;

// Spawn an asteroid every x milliseconds
const ASTEROID_SPAWN_TIME = 500;

const ANGLES = [0, 90, 180, 270];

const MAX_LIVES = 3;

class SpriteGroup {
  constructor(
      scene, useSpriteType, capacity, imageName, width, height, displayWidth,
      displayHeight, mass, collisionCategory=null, collidesWithCategory=null,
      onCollideCallback=null, isDeadFunction=null) {

    this.capacity = capacity;
    this.name = imageName;
    this.scene = scene;

    this.activeSprites = [];
    this.deadSprites = [];
    
    if (isDeadFunction != null) {
      this.isDead = isDeadFunction;
    } else {
      // Default isDead function: when it goes out of the screen
      this.isDead = function(sprite) {
        return (sprite.y < 0 || sprite.y > window.innerHeight);
      }
    }

    for (let i = 0; i < this.capacity; i++) {
      let sprite;

      if (useSpriteType) {
        sprite = scene.matter.add.sprite(width, height, imageName);
      } else {
        sprite = scene.matter.add.image(width, height, imageName);
      }

      sprite.group = this;
      sprite.setDisplaySize(displayWidth, displayHeight);
      sprite.setVisible(false);
      sprite.setFixedRotation();
      sprite.setPosition(-100, -100);
      sprite.setMass(mass);

      sprite.setFriction(0);
      sprite.setFrictionAir(0);
      sprite.setFrictionStatic(0);

      sprite.body.ignoreGravity = true;
      // sprite.body.setAllowGravity(false);
      // sprite.body.setAllowDrag(false);

      sprite.body.isSleeping = true;
      sprite.body.label = imageName;

      if (collisionCategory != null) {
        sprite.setCollisionCategory(collisionCategory);
      }

      if (collidesWithCategory != null) {
        sprite.setCollidesWith(collidesWithCategory);
      }
      
      if (onCollideCallback != null) {
        sprite.setOnCollide(function(collision) {
          onCollideCallback(scene, collision);
        });
      }

      this.deadSprites.push(sprite);
    }
  }
  
  getFirstDead() {
    if (this.deadSprites.length == 0) {
      console.log('WARNING: SpriteGroup "' + this.name + '" has run out of dead sprites.');
      return null;
    }

    let sprite = this.deadSprites.shift();
    sprite.body.isSleeping = false;
    this.activeSprites.push(sprite);
    return sprite;
  }

  kill(sprite, explosion=false, index=-1) {
    // Kills the sprite by moving it off-screen, disabling it, and stopping it's
    // current motion. The `notifyDeath` method is called to indicate to
    // it's parent SpriteGroup that the sprite can be recycled. Lastly,
    // if an explosion sprite was passed along, set it off!
    sprite.body.isSleeping = true;
    sprite.setVisible(false);
    sprite.setVelocity(0, 0);

    let x = sprite.x;
    let y = sprite.y;
    sprite.setPosition(-TILE_SIZE, 0);

    if (explosion) {
        explode(this.scene.explosionGroup.getFirstDead(), x, y);
    }
    
    if (index == -1) {
      for (index = 0; index < this.activeSprites.length; index++) {
        if (this.activeSprites[index] === sprite) {
          break;
        }
      }
    }

    if (index == -1) {
      console.log('ERROR: Could not find killed sprite in active sprites');
      console.log(sprite);
      return;
    }
    
    this.deadSprites.push(sprite);
    this.activeSprites.splice(index, 1);

    // if (this.name === "asteroids") {
    //   console.log(filteredSprites);
    //   console.log('DEAD: ' + this.deadSprites.length + ' | ACTIVE: ' + this.activeSprites.length);// + ' | WAS ACTIVE: ' + this.activeSprites);
    // }
  }

  update() {
    let i = this.activeSprites.length;

    while (i--) {
      if (i < 0 || i >= this.activeSprites.length) { break; }
      let sprite = this.activeSprites[i];
      if (this.isDead(sprite)) {
        this.kill(sprite, false, i);
        i++;
      }
    }
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super();
  }

  preload() {
    this.load.image('enemy', '/images/sprites/enemy-2.png');
    this.load.image('player-agile', '/images/sprites/player-agile-side.png');
    this.load.image('bullet', '/images/sprites/bullet-2.png');
    this.load.spritesheet('explode', '/images/sprites/explode.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 5
    });
    this.load.spritesheet('asteroids', '/images/sprites/asteroids.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 4
    });
  }
  
  create() {
    let defaultCategory = 1;
    let bulletCategory = this.matter.world.nextCategory();
    let playerCategory = this.matter.world.nextCategory();
    let enemyCategory = this.matter.world.nextCategory();
    let explosionCategory = this.matter.world.nextCategory();
    let asteroidsCategory = this.matter.world.nextCategory();

    // this.bullet = this.matter.add.image(11, 11, 'bullet');
    // this.bullet.setDisplaySize(55, 55);
    // this.bullet.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);

    // this.bullet.setCollisionCategory(bulletCategory);
    // this.bullet.setCollidesWith(this.enemyCategory);

    this.explosionGroup = new SpriteGroup(
      this, true, 10, 'explode', 11, 11, TILE_SIZE, TILE_SIZE, 1, explosionCategory, 0
    );

    this.bulletGroup = new SpriteGroup(
      this, false, 20, 'bullet', 11, 11, TILE_SIZE, TILE_SIZE, 5, bulletCategory,
      [asteroidsCategory, enemyCategory]
    );

    this.asteroidsGroup = new SpriteGroup(
      this, true, 25, 'asteroids', 11, 11, TILE_SIZE, TILE_SIZE, 1000, asteroidsCategory,
      [asteroidsCategory, bulletCategory, playerCategory], onCollide,
      function(sprite) {
        return (sprite.y > window.innerHeight + TILE_SIZE);
      }
    );

    this.enemyGroup = new SpriteGroup(
      this, false, 10, 'enemy', 11, 11, TILE_SIZE, TILE_SIZE, 50, enemyCategory,
      [bulletCategory, playerCategory], onCollide
    );

    // this.enemy = this.matter.add.image(11, 11, 'enemy');
    // this.enemy.setDisplaySize(TILE_SIZE, TILE_SIZE);
    let enemy = this.enemyGroup.getFirstDead();
    enemy.setVisible(true);
    enemy.setPosition((window.innerWidth / 2), 100);
    // this.enemy.setCollisionCategory(enemyCategory);
    // this.enemy.setCollidesWith([defaultCategory, bulletCategory, playerCategory]);
    // 
    // this.enemy.setFixedRotation();
    // this.enemy.setAngle(180);
    // this.enemy.setFrictionAir(0.05);
    // this.enemy.setMass(30);
    
    
    this.player = this.matter.add.image(11, 11, 'player-agile');
    this.player.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.player.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);
    this.player.setCollisionCategory(playerCategory);
    this.player.setCollidesWith([defaultCategory, enemyCategory, asteroidsCategory]);
    this.player.body.label = 'player';

    this.player.setFixedRotation();
    this.player.setAngle(270);
    this.player.setFrictionAir(0.05); // Default is 0.01
    this.player.setMass(50); // Default is 3.025

    this.player.moveSpeed = 0.08;
    this.lives = MAX_LIVES;
    
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explode', {
        start: 0,
        end: 5
      }),
      frameRate: 20,
      repeat: 0
    });
    
    this.matter.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
    this.shootPressedDuration = 0;
    this.lastAsteroidSpawn = 0;

    this.inputKeys = this.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        f: Phaser.Input.Keyboard.KeyCodes.F,
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    this.actions = {
      'left': [ 'left', 'a' ],
      'right': [ 'right', 'd' ],
      'up': [ 'up', 'w' ],
      'down': [ 'down', 's' ],
      'shoot': [ 'space', 'f' ]
    };
  }

  isActionPressed(action) {
    if (action in this.actions) {
      let actionKeys = this.actions[action];

      for (let i in actionKeys) {
        let key = actionKeys[i];
        if (this.inputKeys[key].isDown) {
          return true;
        }
      }
    }

    return false;
  }

  update(time, delta) {
    if (this.isActionPressed('left')) {
      this.player.thrustLeft(this.player.moveSpeed);
    }
    else if (this.isActionPressed('right')) {
      this.player.thrustRight(this.player.moveSpeed);
    }
    
    if (this.isActionPressed('up')) {
      this.player.thrust(this.player.moveSpeed);
    }
    else if (this.isActionPressed('down')) {
      this.player.thrustBack(this.player.moveSpeed);
    }
    
    if (this.isActionPressed('shoot')) { // justDown?
      if (this.shootPressedDuration == 0 || this.shootPressedDuration >= 1000) {
        // console.log('firing');
        let bullet = this.bulletGroup.getFirstDead();
        fireBullet(bullet, this.player.x, this.player.y - 22);
        this.shootPressedDuration = 0;
      }
      this.shootPressedDuration += delta;

    } else if (this.shootPressedDuration != 0) {
      this.shootPressedDuration = 0;
    }

    this.bulletGroup.update();
    this.enemyGroup.update();
    this.explosionGroup.update();
    this.asteroidsGroup.update();
    // console.log('DEAD: ' + this.explosionGroup.deadSprites.length + ' | ACTIVE: ' + this.explosionGroup.activeSprites.length);

    if (this.lastAsteroidSpawn == 0 || this.lastAsteroidSpawn >= ASTEROID_SPAWN_TIME) {
      spawnAsteroid(this.asteroidsGroup.getFirstDead());
      this.lastAsteroidSpawn = 0;
    }
    this.lastAsteroidSpawn += delta;
  }
}

function spawnAsteroid(asteroid) {
  if (asteroid == null) {
    return;
  }

  let x = Phaser.Math.Between(0, window.innerWidth);
  asteroid.setPosition(x, -TILE_SIZE);
  asteroid.setVisible(true);

  let angleIndex = Phaser.Math.Between(0, 3);
  asteroid.setRotation(ANGLES[angleIndex]);

  let frameNo = Phaser.Math.Between(0, 4);
  asteroid.setFrame(frameNo);

  let velocityX = 0;//Phaser.Math.Between(-1, 1);
  let velocityY = Phaser.Math.Between(1, 3);
  asteroid.setVelocity(velocityX, velocityY);
}

function fireBullet(bullet, x, y) {
  if (bullet == null) {
    return;
  }

  bullet.setPosition(x, y);
  bullet.setVisible(true);
  bullet.setVelocityY(-15);
}

function explode(explosion, x, y) {
  if (explosion == null) {
    return;
  }

  // console.log("Exploding at: (" + x + ", " + y + ")");
  explosion.setPosition(x, y);
  explosion.setVisible(true);
  explosion.play('explode');
  
  setTimeout(function() {
    explosion.group.kill(explosion, false);
  }, 200);
}



function onCollide(scene, collision) {
  if (collision.bodyA.label === 'asteroids' && collision.bodyB.label === 'player') {
    console.log(collision);
    handleCollideAsteroid(scene, collision.bodyA.gameObject, collision.bodyB.gameObject);
  }
  else if (collision.bodyA.label === 'bullet') {
    handleCollideBullet(scene, collision.bodyA.gameObject, collision.bodyB.gameObject);
  }
}

function handleCollideAsteroid(scene, asteroid, player) {
  asteroid.group.kill(asteroid, true);

  scene.lives--;
  if (scene.lives <= 0) {
    gameOver(scene, player);
  }
}

function handleCollideBullet(scene, bullet, victim) {
  victim.group.kill(victim, true)
  bullet.group.kill(bullet, true);
}

function gameOver(scene, player) {
  player.body.isSleeping = true;
  player.setVisible(false);
  player.setVelocity(0, 0);

  let x = player.x;
  let y = player.y;
  player.setPosition(-TILE_SIZE, 0);
  explode(scene.explosionGroup.getFirstDead(), x, y);

  scene.add.text(window.innerWidth / 2 - 100, window.innerHeight / 2 - 100, 'GAME OVER', {
    fontFamily: 'Monogram',
    fontSize: '60px',
    color: '#DC143C',
    align: 'center'
  });
}

function start_game_engine() {
  let config = {
    type: Phaser.CANVAS,
    antialias: false,
    pixelArt: true,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#222',
    parent: 'game',
    physics: {
      default: 'matter',
      matter: {
        gravity: {
          x: 0,
          y: 0
        }
      }
    },
    scene: GameScene
  };

  const game = new Phaser.Game(config);
}


document.addEventListener('DOMContentLoaded', function () {
  start_game_engine();
  // let sprite = document.getElementById('sprite-transform');
  // sprite.style.display = 'none';
});
