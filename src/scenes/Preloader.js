/**
    - Follows the Boot scene in the game's initialization process.
    - Responsible for loading the majority of game assets4.
    - Displays a loading screen or progress bar to inform players about the loading progress4.
    - Handles loading of larger assets that may take more time, such as images, audio, and other game resources8.
    - Can implement event listeners for load progress, allowing for dynamic updates of the loading screen8.
 */

import { Scene } from 'phaser';
import { screenWidth, screenHeight } from '@/src/config';
import getCenterPosition from '@/src/utils/getCenterPosition';

export class Preloader extends Scene {
	constructor() {
		super('Preloader');
	}

	init() {
		this.createLoadingGraphics();
		this.setupLoadEvents();
	}

	preload() {
		this.loadAssets();
	}

	create() {
		this.initSound();
		this.createAnimations();
	}

	loadAssets() {
		//  Load the assets for the game - Replace with your own assets
		this.load.setPath('assets');

		// Load common assets
		this.loadCommonAssets();

		// Load plugins
		this.loadPlugins();

		// Determine level style
		const levelStyle = this.registry.get('isLevelOverworld') ? 'overworld' : 'underground';

		// Load sprites and assets
		this.loadSpriteSheets(levelStyle);
		this.loadImages(levelStyle);
		this.loadAudio(levelStyle);
	}

	initSound() {
		this.registry.set('musicGroup', {
			musicTheme: this.sound.add('music', { volume: 0.15 }),
			undergroundMusicTheme: this.sound.add('underground-music', { volume: 0.15 }),
			hurryMusicTheme: this.sound.add('hurry-up-music', { volume: 0.15 }),
			gameOverSong: this.sound.add('gameoversong', { volume: 0.3 }),
			winSound: this.sound.add('win', { volume: 0.3 }),
		});

		this.registry.set('soundsEffectGroup', {
			jumpSound: this.sound.add('jumpsound', { volume: 0.1 }),
			coinSound: this.sound.add('coin', { volume: 0.2 }),
			powerUpAppearsSound: this.sound.add('powerup-appears', { volume: 0.2 }),
			consumePowerUpSound: this.sound.add('consume-powerup', { volume: 0.2 }),
			powerDownSound: this.sound.add('powerdown', { volume: 0.3 }),
			goombaStompSound: this.sound.add('goomba-stomp', { volume: 1 }),
			flagPoleSound: this.sound.add('flagpole', { volume: 0.3 }),
			fireballSound: this.sound.add('fireball', { volume: 0.3 }),
			kickSound: this.sound.add('kick', { volume: 0.3 }),
			timeWarningSound: this.sound.add('time-warning', { volume: 0.2 }),
			hereWeGoSound: this.sound.add('here-we-go', { volume: 0.17 }),
			pauseSound: this.sound.add('pauseSound', { volume: 0.17 }),
			blockBumpSound: this.sound.add('block-bump', { volume: 0.3 }),
			breakBlockSound: this.sound.add('break-block', { volume: 0.5 }),
		});

		// init BG music
		this.registry.get('musicGroup').musicTheme.play({ loop: -1 });
	}

	getElementDimensions(width, height, yOffsetFactor) {
		return {
			...getCenterPosition(screenWidth, screenHeight, width, height, yOffsetFactor),
			width,
			height,
		};
	}

	createLoadingGraphics() {
		const progressBox = this.add.graphics().fillStyle(0x222222, 1);
		const progressBar = this.add.graphics();

		const boxDims = this.getElementDimensions(screenWidth / 2, screenHeight / 20.7, 1.05);
		progressBox.fillRoundedRect(boxDims.x, boxDims.y, boxDims.width, boxDims.height, 10);

		const barDims = this.getElementDimensions(screenWidth / 2.2, screenHeight / 34.5, 1.05);

		const percentTextConfig = {
			x: this.cameras.main.width / 2,
			y: (this.cameras.main.height / 2) * 1.25,
			text: '0%',
			style: { font: `${screenWidth / 96}px pixel_nums`, fill: '#ffffff' },
		};

		const percentText = this.make.text(percentTextConfig).setOrigin(0.5, 0.5);

		this.load.on('progress', function (value) {
			const text = value * 99 >= 99 ? 'Generating world...' : `Loading... ${parseInt(value * 99)}%`;
			percentText.setText(text);

			progressBar
				.clear()
				.fillStyle(0xffffff, 1)
				.fillRoundedRect(barDims.x, barDims.y, barDims.width * value, barDims.height, 5);
		});
	}

	setupLoadEvents() {
		this.load.on('complete', () => {
			this.add.graphics().destroy();
			document.getElementById('loading-gif').style.display = 'none';
			this.scene.start('MainMenu');
		});
	}

	loadCommonAssets() {
		const commonAssets = [
			['image', 'logo', 'logo.png'],
			['bitmapFont', 'carrier_command', '/fonts/carrier_command.png', '/fonts/carrier_command.xml'],
		];
		commonAssets.forEach(([type, key, ...args]) => this.load[type](key, ...args));
	}

	loadPlugins() {
		const plugins = [
			[
				'rexvirtualjoystickplugin',
				'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js',
			],
			[
				'rexcheckboxplugin',
				'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcheckboxplugin.min.js',
			],
			[
				'rexsliderplugin',
				'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexsliderplugin.min.js',
			],
			// [
			// 	'rexkawaseblurpipelineplugin',
			// 	'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexkawaseblurpipelineplugin.min.js',
			// ],
		];
		plugins.forEach(([key, path]) => this.load.plugin(key, path, true));
	}

	loadSpriteSheets(levelStyle) {
		const spriteSheets = [
			['mario', '/entities/mario.png', 26, 20],
			['mario-grown', '/entities/mario-grown.png', 18, 32],
			['mario-fire', '/entities/mario-fire.png', 18, 32],
			['goomba', `/entities/${levelStyle}/goomba.png`, 16, 16],
			['koopa', '/entities/koopa.png', 16, 24],
			['shell', '/entities/shell.png', 16, 15],
			['fireball', '/entities/fireball.png', 8, 8],
			['fireball-explosion', '/entities/fireball-explosion.png', 16, 16],
			['npc', '/hud/npc.png', 16, 24],

			// Load objects
			['brick-debris', `/blocks/${levelStyle}/brick-debris.png`, 8, 8],
			['mistery-block', `/blocks/${levelStyle}/misteryBlock.png`, 16, 16],
			['custom-block', '/blocks/overworld/customBlock.png', 16, 16],

			// Load collectibles
			['coin', '/collectibles/coin.png', 16, 16],
			['ground-coin', '/collectibles/underground/ground-coin.png', 10, 14],
			['fire-flower', `/collectibles/${levelStyle}/fire-flower.png`, 16, 16],
		];

		spriteSheets.forEach(([key, path, frameWidth, frameHeight]) => {
			this.load.spritesheet(key, path, { frameWidth, frameHeight });
		});
	}

	loadImages(levelStyle) {
		const images = [
			// Load props
			['cloud1', '/scenery/overworld/cloud1.png'],
			['cloud2', '/scenery/overworld/cloud2.png'],
			['mountain1', '/scenery/overworld/mountain1.png'],
			['mountain2', '/scenery/overworld/mountain2.png'],
			['fence', '/scenery/overworld/fence.png'],
			['bush1', '/scenery/overworld/bush1.png'],
			['bush2', '/scenery/overworld/bush2.png'],
			['castle', '/scenery/castle.png'],
			['flag-mast', '/scenery/flag-mast.png'],
			['final-flag', '/scenery/final-flag.png'],
			['sign', '/scenery/sign.png'],

			// Load tubes
			['horizontal-tube', '/scenery/horizontal-tube.png'],
			['horizontal-final-tube', '/scenery/horizontal-final-tube.png'],
			['vertical-extralarge-tube', '/scenery/vertical-large-tube.png'],
			['vertical-small-tube', '/scenery/vertical-small-tube.png'],
			['vertical-medium-tube', '/scenery/vertical-medium-tube.png'],
			['vertical-large-tube', '/scenery/vertical-large-tube.png'],

			// Load HUD images
			['gear', '/hud/gear.png'],
			['settings-bubble', '/hud/settings-bubble.png'],

			// Load platform bricks and structures
			['floorbricks', '/scenery/' + levelStyle + '/floorbricks.png'],
			['start-floorbricks', '/scenery/overworld/floorbricks.png'],
			['block', '/blocks/' + levelStyle + '/block.png'],
			['block2', '/blocks/underground/block2.png'],
			['emptyBlock', '/blocks/' + levelStyle + '/emptyBlock.png'],
			['immovableBlock', '/blocks/' + levelStyle + '/immovableBlock.png'],

			// Load collectibles
			['live-mushroom', '/collectibles/live-mushroom.png'],
			['super-mushroom', '/collectibles/super-mushroom.png'],
		];

		images.forEach(([key, path]) => this.load.image(key, path));
	}

	loadAudio(levelStyle) {
		const audioFiles = [
			// Load sounds and music
			['music', '/sound/music/overworld/theme.mp3'],
			['underground-music', '/sound/music/underground/theme.mp3'],
			['hurry-up-music', `/sound/music/${levelStyle}/hurry-up-theme.mp3`],
			['gameoversong', '/sound/music/gameover.mp3'],
			['win', '/sound/music/win.wav'],
			['jumpsound', '/sound/effects/jump.mp3'],
			['coin', '/sound/effects/coin.mp3'],
			['powerup-appears', '/sound/effects/powerup-appears.mp3'],
			['consume-powerup', '/sound/effects/consume-powerup.mp3'],
			['powerdown', '/sound/effects/powerdown.mp3'],
			['goomba-stomp', '/sound/effects/goomba-stomp.wav'],
			['flagpole', '/sound/effects/flagpole.mp3'],
			['fireball', '/sound/effects/fireball.mp3'],
			['kick', '/sound/effects/kick.mp3'],
			['time-warning', '/sound/effects/time-warning.mp3'],
			[
				'here-we-go',
				Phaser.Math.Between(0, 100) < 98 ? '/sound/effects/here-we-go.mp3' : '/sound/effects/cursed-here-we-go.mp3',
			],
			['pauseSound', '/sound/effects/pause.wav'],
			['block-bump', '/sound/effects/block-bump.wav'],
			['break-block', '/sound/effects/break-block.wav'],
		];

		audioFiles.forEach(([key, path]) => this.load.audio(key, path));
	}

	createAnimations() {
		const animsConfig = [
			// Mario animations
			{ key: 'idle', frames: [{ key: 'mario', frame: 0 }] },
			{ key: 'run', frames: this.anims.generateFrameNumbers('mario', { start: 3, end: 1 }), frameRate: 12, repeat: -1 },
			{ key: 'hurt', frames: [{ key: 'mario', frame: 4 }] },
			{ key: 'jump', frames: [{ key: 'mario', frame: 5 }] },

			// Maria attack animations
			{ key: 'mario-atk', frames: this.anims.generateFrameNumbers('mario', { start: 6, end: 12 }), frameRate: 12, repeat: -1 },

			// Grown Mario animations
			{ key: 'grown-mario-idle', frames: [{ key: 'mario-grown', frame: 0 }] },
			{
				key: 'grown-mario-run',
				frames: this.anims.generateFrameNumbers('mario-grown', { start: 3, end: 1 }),
				frameRate: 12,
				repeat: -1,
			},
			{ key: 'grown-mario-crouch', frames: [{ key: 'mario-grown', frame: 4 }] },
			{ key: 'grown-mario-jump', frames: [{ key: 'mario-grown', frame: 5 }] },

			// Fire Mario animations
			{ key: 'fire-mario-idle', frames: [{ key: 'mario-fire', frame: 0 }] },
			{
				key: 'fire-mario-run',
				frames: this.anims.generateFrameNumbers('mario-fire', { start: 3, end: 1 }),
				frameRate: 12,
				repeat: -1,
			},
			{ key: 'fire-mario-crouch', frames: [{ key: 'mario-fire', frame: 4 }] },
			{ key: 'fire-mario-jump', frames: [{ key: 'mario-fire', frame: 5 }] },
			{ key: 'fire-mario-throw', frames: [{ key: 'mario-fire', frame: 6 }] },

			// Goomba animations
			{ key: 'goomba-idle', frames: [{ key: 'goomba', frame: 1 }] },
			{
				key: 'goomba-walk',
				frames: this.anims.generateFrameNumbers('goomba', { start: 0, end: 1 }),
				frameRate: 8,
				repeat: -1,
			},
			{ key: 'goomba-hurt', frames: [{ key: 'goomba', frame: 2 }] },

			// Koopa animations
			{ key: 'koopa-idle', frames: [{ key: 'koopa', frame: 1 }] },
			{
				key: 'koopa-walk',
				frames: this.anims.generateFrameNumbers('koopa', { start: 0, end: 1 }),
				frameRate: 8,
				repeat: -1,
			},
			{ key: 'koopa-hurt', frames: [{ key: 'koopa', frame: 0 }] },
			{ key: 'koopa-shell', frames: [{ key: 'koopa', frame: 1 }] },

			// Others
			{
				key: 'coin-default',
				frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 3 }),
				frameRate: 10,
				repeat: -1,
			},
			{
				key: 'ground-coin-default',
				frames: this.anims.generateFrameNumbers('ground-coin', { start: 2, end: 0 }),
				frameRate: 5,
				repeat: -1,
				repeatDelay: 5,
			},
			{
				key: 'mistery-block-default',
				frames: this.anims.generateFrameNumbers('mistery-block', { start: 2, end: 0 }),
				frameRate: 5,
				repeat: -1,
				repeatDelay: 5,
			},
			{
				key: 'custom-block-default',
				frames: this.anims.generateFrameNumbers('custom-block', { start: 2, end: 0 }),
				frameRate: 5,
				repeat: -1,
				repeatDelay: 5,
			},
			{
				key: 'brick-debris-default',
				frames: this.anims.generateFrameNumbers('brick-debris', { start: 0, end: 3 }),
				frameRate: 4,
				repeat: -1,
			},
			{
				key: 'fire-flower-default',
				frames: this.anims.generateFrameNumbers('fire-flower', { start: 0, end: 3 }),
				frameRate: 10,
				repeat: -1,
			},

			// Fireball animations
			...['left-down', 'left-up', 'right-down', 'right-up'].map((direction, index) => ({
				key: `fireball-${direction}`,
				frames: [{ key: 'fireball', frame: index }],
			})),

			// Fireball explosion
			...[0, 1, 2].map((frame) => ({
				key: `fireball-explosion-${frame + 1}`,
				frames: [{ key: 'fireball-explosion', frame }],
			})),

			// NPC
			{
				key: 'npc-default',
				frames: this.anims.generateFrameNumbers('npc', { start: 0, end: 1 }),
				frameRate: 2,
				repeat: -1,
				repeatDelay: 10,
			},
		];

		animsConfig.forEach((config) => this.anims.create(config));
	}
}
