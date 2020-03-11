// Tiles are square so this is used for width and height
const TILE_SIZE = 44;

// Spawn an asteroid every x milliseconds
const ASTEROID_SPAWN_TIME = 600;
const ENEMY_SHOOT_TIME = 1500;

const ANGLES = [0, 90, 180, 270];

const MAX_LIVES = 3;

const EnemyType = {
  BASIC: 0,
  SHOOTER: 1,
  MULTI_SHOOTER: 2,
  KNIGHT: 3,
  BUNNY: 4
};

const PlayerMode = {
  NORMAL: 0,
  SPECIAL: 1
}

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
      displayHeight, mass, voidX, voidY, collisionCategory=null,
      collidesWithCategory=null, onCollideCallback=null, isDeadFunction=null) {

    this.capacity = capacity;
    this.name = imageName;
    this.scene = scene;

    this.activeSprites = [];
    this.deadSprites = [];
    
    this.voidX = voidX;
    this.voidY = voidY;
    
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
      sprite.setPosition(this.voidX, this.voidY);
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
    sprite.setPosition(this.voidX, this.voidY);

    if (explosion) {
      explode(this.scene.explosionGroup.getFirstDead(), x, y);
    }

    if (this.name === 'enemies') {
      if (sprite.type === EnemyType.SHOOTER) {
        removeEnemyShooter(this.scene, sprite);
      }
      if (this.scene.spawnQueue.length === 0 && this.deadSprites.length === this.capacity - 1) {
        finishWave(this.scene);
      }
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

        if (this.name === 'enemies') {
          if (!sprite.hasOwnProperty('explosive') || !sprite.explosive) {
            gameOver(this.scene, this.scene.player);
          }
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
    this.load.spritesheet('player', '/images/sprites/player-special-2.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 15
    });

    this.load.image('bullet', '/images/sprites/bullet-11.png');
    this.load.image('bullet-enemy', '/images/sprites/bullet-5.png');

    this.load.spritesheet('explode', '/images/sprites/explode-3.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 5
    });

    this.load.spritesheet('asteroids', '/images/sprites/asteroids.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 4
    });

    this.load.spritesheet('enemies', '/images/sprites/enemies-2.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 24
    });

    this.load.audio('music-1', '/audio/rep-01.ogg');
    this.load.audio('start', '/audio/warp.wav');
    this.load.audio('shoot', '/audio/shoot.ogg');
    this.load.audio('transform', '/audio/transform.ogg');
    this.load.audio('alarm', '/audio/alarm.wav');
    this.load.audio('special-hit', '/audio/special-hit.wav');

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

    // The current coordinates in void (not shown) space where dead sprites are placed
    // They are placed next to each other in a grid so that they don't collide with
    // each other coincidentally. Their physics should be disabled when they're dead,
    // but dead things keep bumping into each other in the void space for some reason.
    let currVoidX = -TILE_SIZE;
    let currVoidY = -TILE_SIZE;

    this.explosionGroup = new SpriteGroup(
      this, true, 15, 'explode', 11, 11, TILE_SIZE, TILE_SIZE, 1,
      currVoidX, currVoidY, explosionCategory,
      0
    );
    currVoidX -= TILE_SIZE;

    this.bulletGroup = new SpriteGroup(
      this, false, 20, 'bullet', 11, 11, TILE_SIZE, TILE_SIZE, 5,
      currVoidX, currVoidY, bulletCategory,
      [asteroidsCategory, enemyCategory]
    );
    currVoidX -= TILE_SIZE;

    this.enemyBulletGroup = new SpriteGroup(
      this, false, 25, 'bullet-enemy', 11, 11, TILE_SIZE, TILE_SIZE, 5,
      currVoidX, currVoidY, enemyBulletCategory,
      [asteroidsCategory, playerCategory],
      onCollide,
      function(sprite) {
        return (sprite.x < 0 || sprite.x > window.innerWidth || sprite.y > window.innerHeight + TILE_SIZE);
      }
    );
    currVoidX -= TILE_SIZE;

    this.asteroidsGroup = new SpriteGroup(
      this, true, 25, 'asteroids', 11, 11, TILE_SIZE, TILE_SIZE, 50,
      currVoidX, currVoidY, asteroidsCategory,
      [asteroidsCategory, bulletCategory, playerCategory, enemyCategory, enemyBulletCategory],
      onCollide,
      function(sprite) {
        return (sprite.y > window.innerHeight + TILE_SIZE);
      }
    );
    currVoidX -= TILE_SIZE;

    this.enemyGroup = new SpriteGroup(
      this, true, 15, 'enemies', 11, 11, TILE_SIZE, TILE_SIZE, 10,
      currVoidX, currVoidY, enemyCategory,
      [bulletCategory, playerCategory, asteroidsCategory, enemyCategory],
      onCollide,
      function(sprite) {
        return (sprite.y > window.innerHeight + TILE_SIZE);
      }
    );
    currVoidX -= TILE_SIZE;

    // 3. Create and initialize the player sprite
    this.player = this.matter.add.sprite(11, 11, 'player');
    this.player.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.player.setCollisionCategory(playerCategory);
    this.player.setCollidesWith([defaultCategory, enemyCategory, asteroidsCategory, enemyBulletCategory]);
    this.player.body.label = 'player';

    this.player.setFixedRotation();
    this.player.setAngle(270);
    this.player.setFrictionAir(0.05); // Default is 0.01
    this.player.setMass(50); // Default is 3.025

    // this.player.setTint(0x000000);
    this.player.moveSpeed = 0.08;
    
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

    this.anims.create({
      key: 'transform-special',
      frames: this.anims.generateFrameNumbers('player', {
        start: 3,
        end: 12
      }),
      frameRate: 20,
      repeat: 0
    });

    this.anims.create({
      key: 'transform-normal',
      frames: this.anims.generateFrameNumbers('player', {
        start: 12,
        end: 3
      }),
      frameRate: 20,
      repeat: 0
    });

    // 6. Define actions based on key inputs
    this.actions = {
      'left': [ 'left', 'a' ],
      'right': [ 'right', 'd' ],
      'up': [ 'up', 'w' ],
      'down': [ 'down', 's' ],
      'shoot': [ 'space', 'f', 'z', 'x' ]
    };

    this.inputKeys = this.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        f: Phaser.Input.Keyboard.KeyCodes.F,
        z: Phaser.Input.Keyboard.KeyCodes.Z,
        x: Phaser.Input.Keyboard.KeyCodes.X,
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    // 5. Set game and world properties
    this.matter.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
    this.shootPressedDuration = 0;

    this.lastAsteroidSpawn = 0;
    this.lastEnemyShootTime = 0;
    this.lastEnemySpawnTime = 0;

    // 6. Start audio
    this.sounds = {};

    this.sounds.shootGroup = new SoundGroup(this, 10, 'shoot', 0.5);

    this.sounds.start = this.sound.add('start');
    this.sounds.start.play();

    this.sounds.transform = this.sound.add('transform');
    this.sounds.alarm = this.sound.add('alarm');
    this.sounds.alarm.setVolume(0.5);
    this.sounds.specialHit = this.sound.add('special-hit');

    this.sounds.turbulenceGroup = new SoundGroup(this, 10, 'turbulence');
    this.sounds.turbulence2Group = new SoundGroup(this, 10, 'turbulence-2');
    this.sounds.turbulence3Group = new SoundGroup(this, 10, 'turbulence-3');

    let music1 = this.sound.add('music-1');
    music1.setVolume(0.2);
    music1.setLoop(true);
    this.sounds.music1 = music1;

    window.setTimeout(function() {
      music1.play();
    }, 1500);

    // 7. Start wave one
    this.alertText = this.add.text(window.innerWidth / 2 - 100, window.innerHeight / 2 - 100, 'BISCUITS', {
      fontFamily: 'Monogram',
      fontSize: '60px',
      color: '#DC143C',
      align: 'center',
    });

    initGame(this);
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
    if (!this.isGameOver) {
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
    }
    
    if (this.isActionPressed('shoot')) {
      if (this.shootPressedDuration == 0 || this.shootPressedDuration >= 1000) {
        if (this.isGameOver) {
          initGame(this);
        }
        // console.log('firing');
        // if (this.sounds.shoot.isPlaying) {
        //   this.sounds.shoot.seek = 0;
        // } else {
        //   this.sounds.shoot.play();
        // }
        this.sounds.shootGroup.play();
        // transformPlayer(this, this.player);

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
          fireBullet(bullet, shooter.x, shooter.y, 0, 5);

          if (shooter.type === EnemyType.MULTI_SHOOTER) {
            let bullet2 = this.enemyBulletGroup.getFirstDead();
            bullet2.setRotation(-90);
            fireBullet(bullet2, shooter.x, shooter.y, 5, 0);
            let bullet3 = this.enemyBulletGroup.getFirstDead();
            bullet3.setRotation(90);
            fireBullet(bullet3, shooter.x, shooter.y, -5, 0);
          }
        }
        this.lastEnemyShootTime = 0;
      }
      this.lastEnemyShootTime += delta;
    }

    if (this.spawnQueue.length > 0 && !this.isGameOver) {
      if (this.lastEnemySpawnTime >= this.spawnQueue[0].delay) {
        let data = this.spawnQueue.shift();
        spawnEnemy(this, data.type, data.frame, data.x, data.velocityX, data.velocityY);
        this.lastEnemySpawnTime = 0;
      }
      this.lastEnemySpawnTime += delta;
    }
  }
}

function initGame(scene) {
  scene.alertText.setVisible(false);
  scene.kills = 0;
  scene.lives = MAX_LIVES;

  scene.enemyShooters = [];
  scene.spawnQueue = [];
  scene.isGameOver = false;

  scene.player.setFrame(2);
  scene.player.setVisible(true);
  scene.player.body.isSleeping = false;
  scene.player.mode = PlayerMode.NORMAL;
  scene.player.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);

  scene.currWave = 1;
  startWave(scene, scene.currWave);
}

function transformPlayer(scene, player) {
  if (player.mode === PlayerMode.NORMAL) {
    scene.sounds.transform.play();
    player.play('transform-special');
    window.setTimeout(function() {
      player.mode = PlayerMode.SPECIAL;
    }, 500);
  }
  else {
    player.play('transform-normal');
    window.setTimeout(function() {
      player.mode = PlayerMode.NORMAL;
      player.setFrame(scene.lives - 1);
    }, 500);
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
  // last: if this is the last enemy in the wave
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

  if (type === EnemyType.SHOOTER) {
    initEnemy(enemy, type, frame, x, -TILE_SIZE, velocityX, velocityY);
    scene.enemyShooters.push(enemy);
  }
  else if (type === EnemyType.MULTI_SHOOTER) {
    initEnemy(enemy, type, frame, x, -TILE_SIZE, velocityX, velocityY);
    scene.enemyShooters.push(enemy);
  }
  else if (type === EnemyType.KNIGHT) {
    let enemy2 = scene.enemyGroup.getFirstDead();
    if (enemy2 == null) {
      return;
    }

    initEnemy(enemy, type, 6, x, -TILE_SIZE * 2, velocityX, velocityY);
    initEnemy(enemy2, type, 7, x, -TILE_SIZE, velocityX, velocityY);

    // var compoundBody = Phaser.Physics.Matter.Matter.Body.create({
    //     parts: [ enemy.body, enemy2.body ]
    // });
    // enemy2.setExistingBody(compoundBody);

    enemy2.destroyPriorities = [enemy, enemy2];
    enemy.head = enemy2;
    scene.enemyShooters.push(enemy2);

    // enemy.setMass(1);
    // enemy2.setMass(1);
    // scene.matter.add.joint(enemy, enemy2, 0, 1);
  }
  else if (type === EnemyType.BUNNY) {
    let enemy2 = scene.enemyGroup.getFirstDead();
    let enemy3 = scene.enemyGroup.getFirstDead();
    let enemy4 = scene.enemyGroup.getFirstDead();
    if (enemy2 == null || enemy3 == null || enemy4 == null) {
      return;
    }

    initEnemy(enemy2, type, 8, x - TILE_SIZE, -TILE_SIZE * 2, velocityX, velocityY);
    initEnemy(enemy3, type, 9, x, -TILE_SIZE * 2, velocityX, velocityY);
    initEnemy(enemy4, type, 10, x + TILE_SIZE, -TILE_SIZE * 2, velocityX, velocityY);
    initEnemy(enemy, type, 11, x, -TILE_SIZE, velocityX, velocityY);

    // var compoundBody = Phaser.Physics.Matter.Matter.Body.create({
    //     parts: [ enemy.body, enemy2.body ]
    // });
    // enemy2.setExistingBody(compoundBody);

    enemy.destroyPriorities = [enemy2, enemy4, enemy3, enemy];
    enemy2.head = enemy;
    enemy3.head = enemy;
    enemy4.head = enemy;
    scene.enemyShooters.push(enemy);

    // enemy.setMass(1);
    // enemy2.setMass(1);
    // scene.matter.add.joint(enemy, enemy2, 0, 1);
  }
  else {
    initEnemy(enemy, type, frame, x, -TILE_SIZE, velocityX, velocityY);
  }
}

function updateKills(scene) {
  scene.kills = scene.kills + 1;

  if (scene.kills >= 3) {
    transformPlayer(scene, scene.player);
    scene.kills = 0;
  }
}

function fireBullet(bullet, x, y, velocityX=0, velocityY=-15) {
  if (bullet == null) {
    return;
  }

  bullet.setPosition(x, y);
  bullet.setVisible(true);
  bullet.setVelocity(velocityX, velocityY);
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
      handleCollidePlayer(scene, bodyA, bodyB);
    }
  }
  else if (nameB === 'asteroids' && nameA === 'bullet-enemy') {
    if (bodyA.x >= 0 && bodyA.y >= 0 && bodyA.x <= window.innerWidth && bodyA.y <= window.innerHeight) {
      // console.log("X: " + bodyB.x + " | Y: " + bodyB.y);
      bodyB.group.kill(bodyB, true);
      bodyA.group.kill(bodyA, false);
      scene.sounds.turbulenceGroup.play();
      scene.sounds.turbulence2Group.play();
    }
  }
  else if (nameB === 'asteroids' && nameA === 'enemies') {
    // console.log(nameB + ' collides ' + nameA);
    if (bodyA.hasOwnProperty('explosive') && bodyA.explosive) {
      bodyB.group.kill(bodyB, true);
    }
  }
  else if (nameA === 'bullet') {
    if (nameB === 'enemies') {
      updateKills(scene);
    }
    handleCollideBullet(scene, bodyA, bodyB);
  }
  else if (nameA === 'enemies' && nameB === 'enemies') {
    if ((bodyA.hasOwnProperty('explosive') && bodyA.explosive) ||
        (bodyB.hasOwnProperty('explosive') && bodyB.explosive)) {
      bodyA.explosive = false;
      bodyB.explosive = false;
      bodyA.group.kill(bodyA, true);
      bodyB.group.kill(bodyB, true);
      scene.sounds.turbulenceGroup.play();
      scene.sounds.turbulence2Group.play();
    }
  }
}

function handleCollidePlayer(scene, object, player) {
  scene.kills = 0;
  scene.cameras.main.shake(300, 0.003);
  scene.sounds.turbulenceGroup.play();
  scene.sounds.turbulence2Group.play();

  if (player.mode === PlayerMode.SPECIAL) {
    transformPlayer(scene, player);
    scene.sounds.specialHit.play();

    // if (object.body.label === 'bullet-enemy') {
    // 
    // }

    if (object.body.label === 'bullet-enemy') {
      object.setVelocity(player.body.velocity.x * 5, player.body.velocity.y * 5);
    }

    explode(scene.explosionGroup.getFirstDead(), object.x, object.y);
    // console.log(object.frame.sourceIndex + 1);
    object.setFrame(object.frame.name + 12);
    object.explosive = true;
    setTimeout(function() {
      object.group.kill(object, true);
      scene.sounds.turbulenceGroup.play();
      scene.sounds.turbulence2Group.play();
    }, 1500);
  }
  else {
    object.group.kill(object, true);

    scene.sounds.alarm.play();
    scene.lives--;

    if (scene.lives <= 0) {
      gameOver(scene, player);
    }
    else {
      player.setFrame(3);
      window.setTimeout(function() {
        player.setFrame(scene.lives - 1);
      }, 100);
    }
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
  if (scene.isGameOver) {
    return;
  }

  scene.isGameOver = true;
  scene.cameras.main.shake(1000, 0.004, true);
  scene.spawnQueue = [];
  player.body.isSleeping = true;
  player.setVisible(false);
  player.setVelocity(0, 0);

  let x = player.x;
  let y = player.y;
  player.setPosition(-TILE_SIZE, 0);
  explode(scene.explosionGroup.getFirstDead(), x, y);

  scene.alertText.setText('GAME OVER');
  scene.alertText.setVisible(true);
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

function playCredits() {
  // CODE, ART & MUSIC BY  CHRISTIAAN KEYTER
  // I LOVE MAKING GAMES
  // SO HIRE ME!
}

function finishWave(scene) {
  if (scene.isGameOver) {
    return;
  }

  if (scene.currWave > 3) {
    scene.alertText.setText('GREAT SUCCESS! YOU WIN!');
    scene.alertText.setVisible(true);

    window.setTimeout(function() {
      scene.alertText.setVisible(false);
    }, 4000);

    playCredits();
    return;
  }

  scene.alertText.setText('WAVE COMPLETE!');
  scene.alertText.setVisible(true);
  
  window.setTimeout(function() {
    scene.alertText.setVisible(false);
    scene.currWave += 1;
    startWave(scene, scene.currWave);
  }, 4000);
}

function startWave(scene, waveNumber) {
  window.setTimeout(function() {
    scene.alertText.setText('WAVE ' + waveNumber);
    scene.alertText.setVisible(true);
    
    window.setTimeout(function() {
      scene.alertText.setVisible(false);
      if (waveNumber == 1) {
        spawnWaveOne(scene);
      }
      else if (waveNumber == 2) {
        spawnWaveTwo(scene);
      }
      else if (waveNumber == 3) {
        spawnWaveThree(scene);
      }
    }, 2000);
  }, 2000);
}

function spawnWaveOne(scene) {
  let oneThirdX = window.innerWidth / 3;
  let twoThirdsX = oneThirdX * 2;

  let quarterX = window.innerWidth / 4;
  let middleX = window.innerWidth / 2;
  let threeQuartersX = middleX + quarterX;

  let betweenX1 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX2 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX3 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX4 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);

  // Launch the convoy
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, oneThirdX);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, twoThirdsX);
  
  queueSpawnEnemy(6000, scene, EnemyType.BASIC, 0, middleX);
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, quarterX);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 0, threeQuartersX);
  
  queueSpawnEnemy(5000, scene, EnemyType.SHOOTER, 1, middleX);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, quarterX);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 3, threeQuartersX);
  
  queueSpawnEnemy(6000, scene, EnemyType.SHOOTER, 1, oneThirdX, 0.5);
  queueSpawnEnemy(0, scene, EnemyType.SHOOTER, 1, twoThirdsX, -0.5);
  
  queueSpawnEnemy(6000, scene, EnemyType.BASIC, 0, betweenX1);
  queueSpawnEnemy(2000, scene, EnemyType.SHOOTER, 2, betweenX2);
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, betweenX3);
  queueSpawnEnemy(2000, scene, EnemyType.SHOOTER, 2, betweenX4);

  // Last enemy needs to be marked
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 2, middleX, 0, 2, true);
}

function spawnWaveTwo(scene) {
  let oneThirdX = window.innerWidth / 3;
  let twoThirdsX = oneThirdX * 2;

  let quarterX = window.innerWidth / 4;
  let middleX = window.innerWidth / 2;
  let threeQuartersX = middleX + quarterX;

  let enemy9X = middleX / 3;
  let enemy10X = enemy9X * 2;
  let enemy11X = middleX + enemy9X;
  let enemy12X = middleX + (enemy9X * 2);

  let betweenX1 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX2 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX3 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX4 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX5 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);

  // Launch the convoy
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 2, middleX);
  queueSpawnEnemy(3000, scene, EnemyType.SHOOTER, 2, quarterX);
  queueSpawnEnemy(0, scene, EnemyType.SHOOTER, 2, threeQuartersX - (TILE_SIZE * 2));

  queueSpawnEnemy(6000, scene, EnemyType.BASIC, 0, middleX - (TILE_SIZE * 2));
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, quarterX);
  queueSpawnEnemy(4000, scene, EnemyType.MULTI_SHOOTER, 4, middleX);
  queueSpawnEnemy(4000, scene, EnemyType.BASIC, 0, quarterX);

  queueSpawnEnemy(3000, scene, EnemyType.MULTI_SHOOTER, 4, betweenX1);
  queueSpawnEnemy(1000, scene, EnemyType.BASIC, 3, betweenX2);
  queueSpawnEnemy(2000, scene, EnemyType.MULTI_SHOOTER, 4, betweenX3);
  queueSpawnEnemy(1000, scene, EnemyType.BASIC, 3, betweenX4);
  queueSpawnEnemy(1000, scene, EnemyType.BASIC, 3, betweenX5);

  queueSpawnEnemy(6000, scene, EnemyType.SHOOTER, 1, enemy9X);
  queueSpawnEnemy(0, scene, EnemyType.SHOOTER, 1, enemy10X);
  queueSpawnEnemy(2000, scene, EnemyType.KNIGHT, -1, middleX);
  queueSpawnEnemy(2000, scene, EnemyType.SHOOTER, 1, enemy11X);
  queueSpawnEnemy(0, scene, EnemyType.SHOOTER, 1, enemy12X, 0, 2, true);
}

function spawnWaveThree(scene) {
  let oneThirdX = window.innerWidth / 3;
  let twoThirdsX = oneThirdX * 2;

  let quarterX = window.innerWidth / 4;
  let middleX = window.innerWidth / 2;
  let threeQuartersX = middleX + quarterX;

  let enemy9X = middleX / 3;
  let enemy10X = enemy9X * 2;
  let enemy11X = middleX + enemy9X;
  let enemy12X = middleX + (enemy9X * 2);

  let betweenX1 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX2 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX3 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX4 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);
  let betweenX5 = Phaser.Math.Between(quarterX, window.innerWidth - quarterX);

  // Launch the convoy
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, threeQuartersX);
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, betweenX1);
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, betweenX2);
  queueSpawnEnemy(0, scene, EnemyType.BASIC, 0, quarterX);

  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, quarterX);
  queueSpawnEnemy(500, scene, EnemyType.BASIC, 0, quarterX + (TILE_SIZE * 2));
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 1, quarterX + (TILE_SIZE * 2));

  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, middleX);
  queueSpawnEnemy(2000, scene, EnemyType.BASIC, 0, betweenX3);
  queueSpawnEnemy(500, scene, EnemyType.BASIC, 0, quarterX + (TILE_SIZE * 2));

  queueSpawnEnemy(6000, scene, EnemyType.MULTI_SHOOTER, 5, betweenX4);
  queueSpawnEnemy(2000, scene, EnemyType.MULTI_SHOOTER, 5, betweenX5);
  queueSpawnEnemy(4000, scene, EnemyType.MULTI_SHOOTER, 4, threeQuartersX);
  queueSpawnEnemy(4000, scene, EnemyType.BASIC, 2, quarterX);
  // 
  queueSpawnEnemy(6000, scene, EnemyType.SHOOTER, 1, threeQuartersX);
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 1, quarterX + (TILE_SIZE * 2));
  queueSpawnEnemy(2000, scene, EnemyType.MULTI_SHOOTER, 4, quarterX);
  queueSpawnEnemy(1000, scene, EnemyType.SHOOTER, 2, middleX);
  // queueSpawnEnemy(1000, scene, EnemyType.BASIC, 3, betweenX5);
  // 
  // queueSpawnEnemy(6000, scene, EnemyType.SHOOTER, 1, enemy9X);
  // queueSpawnEnemy(0, scene, EnemyType.SHOOTER, 1, enemy10X);
  // queueSpawnEnemy(2000, scene, EnemyType.KNIGHT, -1, middleX);
  // queueSpawnEnemy(2000, scene, EnemyType.SHOOTER, 1, enemy11X);
  queueSpawnEnemy(5000, scene, EnemyType.KNIGHT, -1, enemy12X);
  queueSpawnEnemy(3000, scene, EnemyType.KNIGHT, -1, threeQuartersX);
  queueSpawnEnemy(3000, scene, EnemyType.KNIGHT, -1, betweenX4);
  
  queueSpawnEnemy(2000, scene, EnemyType.BUNNY, -1, middleX);
  queueSpawnEnemy(2000, scene, EnemyType.BUNNY, -1, middleX);
}