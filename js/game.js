// Tiles are square so this is used for width and height
const TILE_SIZE = 44;

// Spawn an asteroid every x milliseconds
const ASTEROID_SPAWN_TIME = 600;
const ENEMY_SHOOT_TIME = 900;

const ANGLES = [0, 90, 180, 270];

const MAX_LIVES = 3;

const EnemyType = {
  BASIC: 0,
  SHOOTER: 1,
  KNIGHT: 2,
  BUNNY: 3
};

class SoundGroup {
  constructor(scene, capacity, soundName, volume=1) {
    this.capacity = capacity;
    this.name = soundName;
    this.scene = scene;

    this.sounds = [];

    for (let i = 0; i < this.capacity; i++) {
      let sound = scene.sound.add(this.name);
      sound.setVolume(volume);
      this.sounds.push(sound);
    }
  }

  play() {
    for (let index in this.sounds) {
      let sound = this.sounds[index];
      if (!sound.isPlaying) {
        sound.play();
        return true;
      }
    }

    console.log('WARNING: SoundGroup "' + this.name + '" has run out of idle sounds.');
    return false;
  }
}

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
        return (sprite.y < 0 || sprite.y > window.innerHeight + TILE_SIZE);
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
    // current motion. The sprite can then be recycled. Lastly, if an explosion
    // sprite was passed along, set it off!
    sprite.body.isSleeping = true;
    sprite.setVisible(false);
    sprite.setVelocity(0, 0);

    let x = sprite.x;
    let y = sprite.y;
    sprite.setPosition(-TILE_SIZE, 0);

    if (explosion) {
        explode(this.scene.explosionGroup.getFirstDead(), x, y);
    }

    if (this.name === 'enemies' && sprite.type === EnemyType.SHOOTER) {
      removeEnemyShooter(this.scene, sprite);
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

        if (this.name === "enemies") {
          gameOver(this.scene, this.scene.player);
        }
      }
    }
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super();
  }

  preload() {
    this.load.image('player-agile', '/images/sprites/player-agile-side.png');
    this.load.image('bullet', '/images/sprites/bullet-2.png');
    this.load.image('bullet-enemy', '/images/sprites/bullet-5.png');

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

    this.load.spritesheet('enemies', '/images/sprites/enemies.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 10
    });

    this.load.audio('music-1', '/audio/rep-01.ogg');
    this.load.audio('start', '/audio/warp.wav');
    this.load.audio('shoot', '/audio/shoot.ogg');

    this.load.audio('turbulence', '/audio/turbulence.wav');
    this.load.audio('turbulence-2', '/audio/turbulence-2.wav');
    this.load.audio('turbulence-3', '/audio/turbulence-3.wav');
  }
  
  create() {
    // 1. Create physics categories for the different kinds of objects in the game
    let defaultCategory = 1;

    let bulletCategory = this.matter.world.nextCategory();
    let playerCategory = this.matter.world.nextCategory();

    let enemyCategory = this.matter.world.nextCategory();
    let enemyBulletCategory = this.matter.world.nextCategory();

    let explosionCategory = this.matter.world.nextCategory();
    let asteroidsCategory = this.matter.world.nextCategory();

    // 2. Create SpriteGroups for the most common sprites
    //    (sprites that will require a lot of recycling)
    this.explosionGroup = new SpriteGroup(
      this, true, 10, 'explode', 11, 11, TILE_SIZE, TILE_SIZE, 1, explosionCategory, 0
    );

    this.bulletGroup = new SpriteGroup(
      this, false, 20, 'bullet', 11, 11, TILE_SIZE, TILE_SIZE, 5, bulletCategory,
      [asteroidsCategory, enemyCategory]
    );

    this.enemyBulletGroup = new SpriteGroup(
      this, false, 25, 'bullet-enemy', 11, 11, TILE_SIZE, TILE_SIZE, 5, enemyBulletCategory,
      [asteroidsCategory, playerCategory], onCollide,
      function(sprite) {
        return (sprite.y > window.innerHeight + TILE_SIZE);
      }
    );

    this.asteroidsGroup = new SpriteGroup(
      this, true, 25, 'asteroids', 11, 11, TILE_SIZE, TILE_SIZE, 1000, asteroidsCategory,
      [asteroidsCategory, bulletCategory, playerCategory, enemyCategory, enemyBulletCategory], onCollide,
      function(sprite) {
        return (sprite.y > window.innerHeight + TILE_SIZE);
      }
    );

    this.enemyGroup = new SpriteGroup(
      this, true, 15, 'enemies', 11, 11, TILE_SIZE, TILE_SIZE, 50, enemyCategory,
      [bulletCategory, playerCategory, asteroidsCategory, enemyCategory], onCollide,
      function(sprite) {
        return (sprite.y > window.innerHeight + TILE_SIZE);
      }
    );

    // 3. Create and initialize the player sprite
    this.player = this.matter.add.image(11, 11, 'player-agile');
    this.player.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.player.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);
    this.player.setCollisionCategory(playerCategory);
    this.player.setCollidesWith([defaultCategory, enemyCategory, asteroidsCategory, enemyBulletCategory]);
    this.player.body.label = 'player';

    this.player.setFixedRotation();
    this.player.setAngle(270);
    this.player.setFrictionAir(0.05); // Default is 0.01
    this.player.setMass(50); // Default is 3.025

    // this.player.setTint(0x000000);
    this.player.moveSpeed = 0.08;
    this.lives = MAX_LIVES;
    
    // 4. Create animations
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explode', {
        start: 0,
        end: 5
      }),
      frameRate: 20,
      repeat: 0
    });

    // 5. Set game and world properties
    this.matter.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
    this.shootPressedDuration = 0;
    this.enemyShooters = [];

    this.lastAsteroidSpawn = 0;
    this.lastEnemyShootTime = 0;
    this.lastEnemySpawnTime = 0;
    this.spawnQueue = [];

    // 6. Define actions based on key inputs
    this.actions = {
      'left': [ 'left', 'a' ],
      'right': [ 'right', 'd' ],
      'up': [ 'up', 'w' ],
      'down': [ 'down', 's' ],
      'shoot': [ 'space', 'f' ]
    };

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

    // 6. Start audio
    this.sounds = {};

    this.sounds.shootGroup = new SoundGroup(this, 10, 'shoot', 0.5);

    this.sounds.start = this.sound.add('start');
    this.sounds.start.play();

    this.sounds.turbulenceGroup = new SoundGroup(this, 5, 'turbulence');
    this.sounds.turbulence2Group = new SoundGroup(this, 5, 'turbulence-2');
    this.sounds.turbulence3Group = new SoundGroup(this, 5, 'turbulence-3');

    let music1 = this.sound.add('music-1');
    music1.setVolume(0.4);
    this.sounds.music1 = music1;

    window.setTimeout(function() {
      music1.play();
    }, 1500);

    // 7. Start wave one
    let scene = this;
    window.setTimeout(function() {
      let text = scene.add.text(window.innerWidth / 2 - 100, window.innerHeight / 2 - 100, 'WAVE 1', {
        fontFamily: 'Monogram',
        fontSize: '60px',
        color: '#DC143C',
        align: 'center'
      });
      
      window.setTimeout(function() {
        text.setVisible(false);
        startWaveOne(scene);
      }, 4000);
    }, 3000);
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
        // if (this.sounds.shoot.isPlaying) {
        //   this.sounds.shoot.seek = 0;
        // } else {
        //   this.sounds.shoot.play();
        // }
        this.sounds.shootGroup.play();

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
    this.enemyBulletGroup.update();
    // console.log('DEAD: ' + this.explosionGroup.deadSprites.length + ' | ACTIVE: ' + this.explosionGroup.activeSprites.length);

    if (this.lastAsteroidSpawn == 0 || this.lastAsteroidSpawn >= ASTEROID_SPAWN_TIME) {
      spawnAsteroid(this.asteroidsGroup.getFirstDead());
      this.lastAsteroidSpawn = 0;
    }
    this.lastAsteroidSpawn += delta;

    if (this.enemyShooters.length > 0) {
      if (this.lastEnemyShootTime == 0 || this.lastEnemyShootTime >= ENEMY_SHOOT_TIME) {
        for (let index in this.enemyShooters) {
          let shooter = this.enemyShooters[index];
          let bullet = this.enemyBulletGroup.getFirstDead();
          fireBullet(bullet, shooter.x, shooter.y, 5);
        }
        this.lastEnemyShootTime = 0;
      }
      this.lastEnemyShootTime += delta;
    }

    if (this.spawnQueue.length > 0) {
      if (this.lastEnemySpawnTime >= this.spawnQueue[0].delay) {
        let data = this.spawnQueue.shift();
        spawnEnemy(this, data.type, data.frame, data.x, data.velocityX, data.velocityY);
        this.lastEnemySpawnTime = 0;
      }
      this.lastEnemySpawnTime += delta;
    }
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

function removeEnemyShooter(scene, enemy) {
  let i = scene.enemyShooters.length;

  while (i >= 0 && i <= scene.enemyShooters.length) {
    i--;
    let shooter = scene.enemyShooters[i];
    if (shooter.id === enemy.id) {
      scene.enemyShooters.splice(i, 1);
      return;
    }
  }
}

function initEnemy(enemy, type, frame, x, y, velocityX, velocityY) {
  enemy.setFrame(frame);
  enemy.setPosition(x, y);
  enemy.setVisible(true);
  enemy.setVelocity(velocityX, velocityY);
  enemy.type = type;
}

function queueSpawnEnemy(delay, scene, type, frame, x, velocityX=0, velocityY=2) {
  // delay: between the previously spawned enemy and this one
  scene.spawnQueue.push({
    delay: delay,
    type: type,
    frame: frame,
    x: x,
    velocityX: velocityX,
    velocityY: velocityY
  });
}

function spawnEnemy(scene, type, frame, x, velocityX=0, velocityY=2) {
  let enemy = scene.enemyGroup.getFirstDead();
  if (enemy == null) {
    return;
  }

  if (type === EnemyType.KNIGHT) {
    let enemy2 = scene.enemyGroup.getFirstDead();
    if (enemy2 == null) {
      return;
    }

    initEnemy(enemy, type, 6, x, -TILE_SIZE * 2, velocityX, velocityY);
    initEnemy(enemy2, type, 7, x, -TILE_SIZE, velocityX, velocityY);

    enemy2.destroyPriorities = [enemy, enemy2];
    enemy.head = enemy2;
    scene.enemyShooters.push(enemy2);

    // enemy.setMass(1);
    // enemy2.setMass(1);
    // scene.matter.add.joint(enemy, enemy2, 0, 1);
  }
  else if (type === EnemyType.SHOOTER) {
    initEnemy(enemy, type, frame, x, -TILE_SIZE, velocityX, velocityY);
    scene.enemyShooters.push(enemy);
  }
  else {
    initEnemy(enemy, type, frame, x, -TILE_SIZE, velocityX, velocityY);
  }
}

function startWaveOne(scene) {
  // First 2 enemies come down simultaneously
  let enemy1X = window.innerWidth / 3;
  let enemy2X = enemy1X * 2;

  // Next 2 come down a little wider
  let enemy3X = (window.innerWidth / 3) - 50;
  let enemy4X = (enemy1X * 2) + 50;

  // Next 3 come down aligned
  let enemy5X = window.innerWidth / 4;
  let enemy6X = window.innerWidth / 2;
  let enemy7X = enemy5X + enemy6X;

  // 2 come swooping from the sides while 4 come down scattered in the middle
  let quarterWidth = window.innerWidth / 4;
  let enemy8X = Phaser.Math.Between(quarterWidth, window.innerWidth - quarterWidth);
  let enemy9X = Phaser.Math.Between(quarterWidth, window.innerWidth - quarterWidth);
  let enemy10X = Phaser.Math.Between(quarterWidth, window.innerWidth - quarterWidth);
  let enemy11X = Phaser.Math.Between(quarterWidth, window.innerWidth - quarterWidth);

  // Launch the convoy
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, enemy1X);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, enemy2X);

  queueSpawnEnemy(6000, scene, EnemyType.BASIC, 0, enemy3X);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 0, enemy4X);
  
  queueSpawnEnemy(6000, scene, EnemyType.SHOOTER, 1, enemy6X);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, enemy5X);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, enemy7X);
  
  queueSpawnEnemy(6000, scene, EnemyType.SHOOTER, 1, enemy3X, 0.5);
  queueSpawnEnemy(0, scene, EnemyType.SHOOTER, 1, enemy4X, -0.5);
  
  queueSpawnEnemy(6000, scene, EnemyType.BASIC, 0, enemy8X);
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 2, enemy9X);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 0, enemy10X);
  queueSpawnEnemy(500, scene, EnemyType.SHOOTER, 2, enemy11X);
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 2, enemy6X);
}

function fireBullet(bullet, x, y, velocityY=-15) {
  if (bullet == null) {
    return;
  }

  bullet.setPosition(x, y);
  bullet.setVisible(true);
  bullet.setVelocityY(velocityY);
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
  let bodyA = collision.bodyA.gameObject;
  let bodyB = collision.bodyB.gameObject;
  let nameA = collision.bodyA.label;
  let nameB = collision.bodyB.label;
  // console.log("A: " + nameA + " | B: " + nameB);

  if (nameB === 'player') {
    if (nameA === 'asteroids' || nameA === 'enemies' || nameA === 'bullet-enemy') {
      console.log(collision);
      handleCollidePlayer(scene, bodyA, bodyB);
    }
  }
  else if (nameB === 'asteroids' && nameA === 'bullet-enemy') {
    bodyB.group.kill(bodyB, true);
    bodyA.group.kill(bodyA, false);
    scene.sounds.turbulenceGroup.play();
    scene.sounds.turbulence2Group.play();
  }
  else if (nameA === 'bullet') {
    handleCollideBullet(scene, bodyA, bodyB);
  }
}

function handleCollidePlayer(scene, object, player) {
  scene.cameras.main.shake(300, 0.003);
  object.group.kill(object, true);
  scene.sounds.turbulenceGroup.play();
  scene.sounds.turbulence2Group.play();

  scene.lives--;
  if (scene.lives <= 0) {
    gameOver(scene, player);
  }
}

function handleCollideBullet(scene, bullet, victim) {
  if (victim.hasOwnProperty('head')) {
    victim = victim.head;
  }

  if (victim.hasOwnProperty('destroyPriorities') && victim.destroyPriorities.length > 0) {
    let nextVictim = victim.destroyPriorities.shift();
    victim = nextVictim;
  }

  victim.group.kill(victim, true)
  bullet.group.kill(bullet, false);
  scene.sounds.turbulence2Group.play();
  scene.sounds.turbulence3Group.play();
}

function gameOver(scene, player) {
  scene.cameras.main.shake(1000, 0.004, true);
  scene.spawnQueue = [];
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
