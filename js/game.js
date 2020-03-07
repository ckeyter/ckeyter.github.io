class SpriteGroup {
  constructor(scene, capacity, imageName, width, height, displayWidth, displayHeight, collisionCategory, collidesWithCategory) {
    this.capacity = capacity;

    this.activeSprites = [];
    this.deadSprites = [];

    let i;
    for (i = 0; i < this.capacity; i++) {
      let sprite = scene.matter.add.image(width, height, imageName);
      sprite.setDisplaySize(displayWidth, displayHeight);
      sprite.setVisible(false);

      sprite.setCollisionCategory(collisionCategory);
      sprite.setCollidesWith(collidesWithCategory);

      this.deadSprites.push(sprite);
    }
  }
  
  getFirstDead() {
    if (this.deadSprites.length == 0) {
      return null;
    }
    
    let sprite = this.deadSprites.shift();
    this.activeSprites.push(sprite);
    return sprite;
  }
  
  update() {
    let i = this.activeSprites.length;

    while (i--) {
      let sprite = this.activeSprites[i];
      if (sprite.y <= 0) {
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
    this.load.image('player-agile', '/images/sprites/player-agile-side.png');
    this.load.image('bullet', '/images/sprites/bullet-2.png');
  }
  
  create() {
    let defaultCategory = 1;
    let bulletCategory = this.matter.world.nextCategory();
    let playerCategory = this.matter.world.nextCategory();
    let enemyCategory = this.matter.world.nextCategory();

    // this.bullet = this.matter.add.image(11, 11, 'bullet');
    // this.bullet.setDisplaySize(55, 55);
    // this.bullet.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);

    // this.bullet.setCollisionCategory(bulletCategory);
    // this.bullet.setCollidesWith(this.enemyCategory);
    
    this.bulletGroup = new SpriteGroup(this, 10, 'bullet', 11, 11, 55, 55, bulletCategory, enemyCategory);
    
    // this.playerGroup = this.matter.world.nextGroup();
    this.player = this.matter.add.image(11, 11, 'player-agile');
    this.player.setDisplaySize(55, 55);
    this.player.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);
    this.player.setCollisionCategory(playerCategory);
    this.player.setCollidesWith([defaultCategory, enemyCategory]);

    this.player.setFixedRotation();
    this.player.setAngle(270);
    this.player.setFrictionAir(0.05);
    this.player.setMass(30);

    this.player.moveSpeed = 0.08;

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
        // console.log("ACTIVE: " + this.bulletGroup.activeSprites.length + " | DEAD: " + this.bulletGroup.deadSprites.length);

        if (bullet != null) {
          bullet.setPosition(this.player.x, this.player.y - 22);
          bullet.setVisible(true);
          bullet.setVelocityY(-15);
        } else {
          console.log("WARNING: Out of bullet capacity");
        }
        this.shootPressedDuration = 0;
      }

      this.shootPressedDuration += delta;
    } else {
      this.shootPressedDuration = 0;
    }

    this.bulletGroup.update();
  }
  
  fireBullet() {
    var bullet = Bullet(this, 0, 0);
    bullet.fire(this.player.x, this.player.y - 20);
  //   const bullet = this.bullets.getFirstDead(false);
  // 
  //   if (bullet) {
  //     bullet.body.reset(this.player.x, this.player.y - 20);
  //     bullet.setActive(true);
  //     bullet.setVisible(true);
  //     bullet.setVelocityY(-900);
  //   }
  }
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
