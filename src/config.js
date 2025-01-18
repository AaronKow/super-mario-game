export const screenWidth = window.innerWidth;
export const screenHeight = window.innerHeight * 1.1;
export const velocityY = screenHeight / 1.15;
export const velocityX = screenWidth / 4.5;
export const levelGravity = velocityY * 2;
export const worldWidth = screenWidth * 11;
export const platformPieces = 100;

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
export const config = {
	type: Phaser.AUTO,
	width: screenWidth,
	height: screenHeight,
	preserveDrawingBuffer: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: levelGravity },
			debug: false,
		},
	},
	parent: 'game-container',
	backgroundColor: '#028af8',
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: '100%',
		height: '100%',
	},
};

// for control technique
// Source: https://github.com/photonstorm/phaser3-examples/blob/master/public/src/tilemap/collision/matter%20destroy%20tile%20bodies.js#L35
const playerController = {
	time: {
		leftDown: 0,
		rightDown: 0,
	},
	direction: {
		positive: true,
	},
	speed: {
		run: velocityX,
	},
};
const playerSpeed = 0.001;
const SmoothedHorionztalControl = new Phaser.Class({
	initialize: function SmoothedHorionztalControl(speed) {
		this.msSpeed = speed;
		this.value = 0;
	},

	moveLeft: function (delta) {
		if (this.value > 0) {
			this.reset();
		}
		this.value -= this.msSpeed * 3.5;
		if (this.value < -1) {
			this.value = -1;
		}
		playerController.time.rightDown += delta;
	},

	moveRight: function (delta) {
		if (this.value < 0) {
			this.reset();
		}
		this.value += this.msSpeed * 3.5;
		if (this.value > 1) {
			this.value = 1;
		}
		playerController.time.leftDown += delta;
	},

	reset: function () {
		this.value = 0;
	},
});

// Game States
export const gameStates = {
	screenWidth,
	screenHeight,
	velocityX,
	velocityY,
	levelGravity,
	worldWidth,
	platformHeight: screenHeight / 5,
	startOffset: screenWidth / 2.5,

	// Hole with is calculated dividing the world width in x holes of the same size.
	platformPieces,
	platformPiecesWidth: (worldWidth - screenWidth) / platformPieces,
	isLevelOverworld: Phaser.Math.Between(0, 100) <= 84,

	// Create empty holes array, every hole will have their object with the hole start and end
	worldHolesCoords: [],
	emptyBlocksList: [],
	player: null,
	playerState: 0,
	playerInvulnerable: false,
	playerBlocked: false,
	playerFiring: false,
	fireInCooldown: false,
	furthestPlayerPos: 0,
	flagRaised: false,
	controlKeys: {
		JUMP: null,
		DOWN: null,
		LEFT: null,
		RIGHT: null,
		FIRE: null,
		PAUSE: null,
	},
	score: 0,
	timeLeft: 300,
	joyStick: null,
	levelStarted: false,
	reachedLevelEnd: false,
	smoothedControls: new SmoothedHorionztalControl(playerSpeed),
	gameOver: false,
	gameWinned: false,
	playerController,

	// settings
	settingsMenuOpen: false,
	musicGroup: null,
	soundsEffectGroup: null,
};
