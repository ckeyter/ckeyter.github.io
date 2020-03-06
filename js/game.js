// class BulletGroup {
//   constructor() {
//     this.bullets = [];
//   }
// }

class GameScene extends Phaser.Scene {
  constructor() {
    super();
  }

  preload() {
    this.load.image('player-agile', '/images/sprites/player-agile-side.png');
    this.load.image('bullet', '/images/sprites/bullet.png');
  }
  
  create() {
    let defaultCategory = 1;
    let bulletCategory = this.matter.world.nextCategory();
    let playerCategory = this.matter.world.nextCategory();
    let enemyCategory = this.matter.world.nextCategory();

    this.bullet = this.matter.add.image(11, 11, 'bullet');
    this.bullet.setDisplaySize(55, 55);
    this.bullet.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);

    this.bullet.setCollisionCategory(bulletCategory);
    this.bullet.setCollidesWith(this.enemyCategory);
    
    // this.playerGroup = this.matter.world.nextGroup();
    this.player = this.matter.add.image(11, 11, 'player-agile');
    this.player.setDisplaySize(55, 55);
    this.player.setPosition((window.innerWidth / 2), (window.innerHeight / 2) + 28);
    this.player.setCollisionCategory(this.playerCategory);
    this.player.setCollidesWith([this.defaultCategory, this.enemyCategory]);

    this.player.setFixedRotation();
    this.player.setAngle(270);
    this.player.setFrictionAir(0.05);
    this.player.setMass(30);

    this.player.moveSpeed = 0.08;

    this.matter.world.setBounds(0, 0, window.innerWidth, window.innerHeight);

    this.inputKeys = this.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
  }

  update() {
    if (this.inputKeys.left.isDown || this.inputKeys.a.isDown) {
      this.player.thrustLeft(this.player.moveSpeed);
    }
    else if (this.inputKeys.right.isDown || this.inputKeys.d.isDown) {
      this.player.thrustRight(this.player.moveSpeed);
    }
    
    if (this.inputKeys.up.isDown || this.inputKeys.w.isDown) {
      this.player.thrust(this.player.moveSpeed);
    }
    else if (this.inputKeys.down.isDown || this.inputKeys.s.isDown) {
      this.player.thrustBack(this.player.moveSpeed);
    }
    
    if (this.inputKeys.space.isDown) { // justDown?
      // bullets.fireBullet(this.player.x, this.player.y - 20);
      // console.log('space');
      // fireBullet();
      this.bullet.setVelocityY(-1);
      console.log("X: " + this.bullet.x + " | Y: " + this.bullet.y);
    }
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
