class SpriteGroup {
  constructor(
      scene, useSpriteType, capacity, imageName, width, height, displayWidth,
      displayHeight, collisionCategory=null, collidesWithCategory=null,
      onCollideCallback=null, isDeadFunction=null) {

    this.capacity = capacity;

    this.activeSprites = [];
    this.deadSprites = [];
    
    if (isDeadFunction != null) {
      this.isDead = isDeadFunction;
    } else {
      // Default isDead function: when it goes out of the screen
      this.isDead = function(sprite) {
        return (sprite.y < 0 || sprite.y > window.innerHeight || sprite.hasOwnProperty('killed'));
      }
    }

    for (let i = 0; i < this.capacity; i++) {
      let sprite;

      if (useSpriteType) {
        sprite = scene.matter.add.sprite(width, height, imageName);
      } else {
        sprite = scene.matter.add.image(width, height, imageName);
      }
      
      sprite.setDisplaySize(displayWidth, displayHeight);
      sprite.setVisible(false);
      sprite.setFixedRotation();
      sprite.setPosition(-100, -100);
      // sprite.setMass(0);

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
      return null;
    }
    
    let sprite = this.deadSprites.shift();
    sprite.body.isSleeping = false;
    this.activeSprites.push(sprite);
    return sprite;
  }
  
  update() {
    let i = this.activeSprites.length;

    while (i--) {
      let sprite = this.activeSprites[i];
      if (this.isDead(sprite)) {
        // console.log(sprite);
        sprite.body.isSleeping = true;
        sprite.setPosition(-100, -100);
        this.deadSprites.push(sprite);
        this.activeSprites.splice(i, 1);
      }
    }
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super();
  }

  preload() {
    this.load.image('enemy', '/images/sprites/enemy.png');
    this.load.image('player-agile', '/images/sprites/player-agile-side.png');
    this.load.image('bullet', '/images/sprites/bullet-2.png');
    this.load.spritesheet('explode', '/images/sprites/explode.png', {
      frameWidth: 11,
      frameHeight: 11,
      endFrame: 5
    });
  }
  
  create() {
    // Tiles are square so this is used for width and height
    const TILE_SIZE = 55;

    let defaultCategory = 1;
    let bulletCategory = this.matter.world.nextCategory();
    let playerCategory = this.matter.world.nextCategory();
    let enemyCategory = this.matter.world.nextCategory();
    let explosionCategory = this.matter.world.nextCategory();

    // this.bullet = this.matter.add.image(11, 11, 'bullet');
    // this.bullet.setDisplaySize(55, 55);
    // this.bullet.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);

    // this.bullet.setCollisionCategory(bulletCategory);
    // this.bullet.setCollidesWith(this.enemyCategory);

    this.explosionGroup = new SpriteGroup(
      this, true, 10, 'explode', 11, 11, TILE_SIZE, TILE_SIZE, explosionCategory, 0
    );

    this.bulletGroup = new SpriteGroup(
      this, false, 10, 'bullet', 11, 11, TILE_SIZE, TILE_SIZE, bulletCategory, enemyCategory
    );

    this.enemyGroup = new SpriteGroup(
      this, false, 10, 'enemy', 11, 11, TILE_SIZE, TILE_SIZE, enemyCategory,
      [bulletCategory, playerCategory], onEnemyCollide
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
    
    
    // this.playerGroup = this.matter.world.nextGroup();
    this.player = this.matter.add.image(11, 11, 'player-agile');
    this.player.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.player.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);
    this.player.setCollisionCategory(playerCategory);
    this.player.setCollidesWith([defaultCategory, enemyCategory]);
    this.player.body.label = 'player';

    this.player.setFixedRotation();
    this.player.setAngle(270);
    this.player.setFrictionAir(0.05);
    this.player.setMass(30);

    this.player.moveSpeed = 0.08;
    
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
      "left": [ "left", "a" ],
      "right": [ "right", "d" ],
      "up": [ "up", "w" ],
      "down": [ "down", "s" ],
      "shoot": [ "space", "f" ]
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
    if (this.isActionPressed("left")) {
      this.player.thrustLeft(this.player.moveSpeed);
    }
    else if (this.isActionPressed("right")) {
      this.player.thrustRight(this.player.moveSpeed);
    }
    
    if (this.isActionPressed("up")) {
      this.player.thrust(this.player.moveSpeed);
    }
    else if (this.isActionPressed("down")) {
      this.player.thrustBack(this.player.moveSpeed);
    }
    
    if (this.isActionPressed("shoot")) { // justDown?
      if (this.shootPressedDuration == 0 || this.shootPressedDuration >= 1000) {
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
  }
}

function fireBullet(bullet, x, y) {
  if (bullet == null) {
    console.log("WARNING: Out of bullet capacity");
    return;
  }

  bullet.setPosition(x, y);
  bullet.setVisible(true);
  bullet.setVelocityY(-15);
}

function onEnemyCollide(scene, collision) {
  let enemy = collision.bodyB;
  let bullet = collision.bodyA;

  if (enemy.label != "enemy" || bullet.label != "bullet") {
    console.log("Collision: not enemy and bullet");
    return;
  }

  enemy.isSleeping = true;
  enemy.gameObject.setVelocity(0, 0);
  enemy.gameObject.setVisible(false);
  enemy.gameObject.killed = true;
  
  bullet.gameObject.setVisible(false);
  bullet.gameObject.killed = true;

  let explosion = scene.explosionGroup.getFirstDead();
  explosion.setPosition(enemy.gameObject.x, enemy.gameObject.y);
  explosion.setVisible(true);
  explosion.play('explode');
  
  setTimeout(function() {
    explosion.killed = true;
  }, 1000);
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


document.addEventListener("DOMContentLoaded", function () {
  start_game_engine();
  // let sprite = document.getElementById("sprite-transform");
  // sprite.style.display = "none";
});
