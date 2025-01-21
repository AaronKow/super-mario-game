import { Scene } from 'phaser';
import Player from '@/src/classes/Player';
import World from '@/src/classes/World';
import mapRegistry from '@/src/utils/mapRegistry';
import watchEvent from '@/src/utils/watchEvent';

export class MainMenu extends Scene {
	constructor() {
		super('MainMenu');
		this.importRegistry = [
			'screenWidth',
			'screenHeight',
			'velocityY',
			'musicGroup',
			'soundsEffectGroup',
			'platformHeight',
			'worldWidth',
			'controlKeys',
			'startOffset',
			'gameOver',
			'gameWinned',
			'joyStick',
			'smoothedControls',
			'playerController',
			'playerState',
			'playerBlocked',
			'playerInvulnerable',
			'isLevelOverworld',
		];
		this.startScreenTrigger = null;
	}

	create() {
		// map global registry
		mapRegistry(this, this.importRegistry);

		// watch registry
		this.watchRegistries();

		// watch events
		this.watchEvents();

		// create player
		this.createPlayer();

		// draw start screen
		this.drawStartScreen();

		// set camera
		this.cameras.main.setBounds(0, 0, this.worldWidth, 0);
	}

	update(delta) {
		if (this.gameOver || this.gameWinned) return;

		this.playerInstance.updatePlayer.call(this, delta);
	}

	watchRegistries() {
		this.registry.events.on(
			'changedata',
			(parent, key, data) => {
				// console.log('>> key', key, data);
			},
			this,
		);
	}

	watchEvents() {
		watchEvent(this, 'playerInvulnerable');
		watchEvent(this, 'playerBlocked');
	}

	drawStartScreen() {
		// start world instance
		this.worldInstance = new World(this);
		this.worldInstance.drawStartScreen.call(this);

		// start game logic
		this.startScreenTrigger = this.add
			.tileSprite(this.screenWidth, this.screenHeight - this.platformHeight, 32, 28, 'horizontal-tube')
			.setScale(this.screenHeight / 345)
			.setOrigin(1, 1);
		this.startScreenTrigger.depth = 4;
		this.physics.add.existing(this.startScreenTrigger);
		this.startScreenTrigger.body.allowGravity = false;
		this.startScreenTrigger.body.immovable = true;
		this.physics.add.collider(this.player, this.startScreenTrigger, this.startLevel, null, this);
	}

	startLevel(player, trigger) {
		const playerBounds = player.getBounds();
		const doorBounds = trigger.getBounds();

		// Check if the player's right edge is touching or overlapping the door's left edge
		if (playerBounds.right <= doorBounds.left + 10) {
			this.registry.get('soundsEffectGroup').powerDownSound.play();

			this.physics.world.setBounds(this.screenWidth, 0, this.worldWidth, this.screenHeight);
			player.setVelocityX(5);
			player.anims.play('run', true).flipX = false;

			this.events.emit('playerBlocked', true);

			this.cameras.main.fadeOut(900, 0, 0, 0);

			this.registry.get('soundsEffectGroup').hereWeGoSound.play();

			setTimeout(() => {
				if (!this.isLevelOverworld) {
					player.y = this.screenHeight / 5;
					this.registry.get('musicGroup').musicTheme.stop();
					this.registry.get('musicGroup').undergroundMusicTheme.play({ loop: -1 });
				}

				// destroy player in this scene
				this.destroyPlayer();

				player.x = this.screenWidth * 1.1;
				this.cameras.main.pan(this.screenWidth * 1.5, 0, 0);
				this.events.emit('playerBlocked', false);
				this.cameras.main.fadeIn(500, 0, 0, 0);
				this.startScreenTrigger.destroy();
				this.scene.start('Game');
				if (this.settingsMenuOpen) hideSettings.call(this);
			}, 1100);
		}
	}

	createPlayer() {
		// create player instance
		this.playerInstance = new Player(this);
		this.player = this.playerInstance.createPlayer();

		// create controls
		this.playerInstance.createControls.call(this);

		// update registry
		this.registry.set('player', this.player);
	}

	destroyPlayer() {
		this.player.destroy();
		this.player = null;
		this.registry.set('player', this.player);
	}

	hideSettings() {
		let settingsObjects = this.settingsMenuObjects.getChildren();

		for (let i = 0; i < settingsObjects.length; i++) {
			settingsObjects[i].visible = false;
		}
		this.musicGroup.musicTheme.resume();
		this.events.emit('playerBlocked', false);
		this.applySettings();
		this.registry.set('settingsMenuOpen', false);
	}

	drawSettingsMenu() {
		if (this.settingsMenuCreated) {
			let settingsObjects = this.settingsMenuObjects.getChildren();
			for (let i = 0; i < settingsObjects.length; i++) {
				settingsObjects[i].visible = true;
			}
			return;
		}

		this.settingsMenuCreated = true;

		this.settingsMenuObjects = this.add.group();

		//> Settings
		let settingsBackground = this.add
			.rectangle(0, this.screenHeight / 2, this.worldWidth, this.screenHeight, 0x171717, 0.95)
			.setScrollFactor(0);
		settingsBackground.depth = 4;
		this.settingsMenuObjects.add(settingsBackground);

		let settingsXbutton = this.add
			.text(this.screenWidth * 0.94, this.screenHeight - this.screenHeight * 0.9, 'x', {
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 50,
				align: 'center',
			})
			.setInteractive()
			.on('pointerdown', () => this.hideSettings());
		settingsXbutton.depth = 5;
		this.settingsMenuObjects.add(settingsXbutton);

		let settingsText = this.add.text(this.screenWidth / 6, this.screenHeight - this.screenHeight * 0.85, 'Settings', {
			fontFamily: 'pixel_nums',
			fontSize: this.screenWidth / 45,
			align: 'center',
		});
		settingsText.depth = 5;
		this.settingsMenuObjects.add(settingsText);

		let musicCheckbox = this.add.rexCheckbox(
			this.screenWidth / 10,
			this.screenHeight / 2.9,
			this.screenWidth / 40,
			this.screenWidth / 40,
			{
				color: 0x323232,
				checked:
					localStorage.getItem('music-enabled') == 'true' || localStorage.getItem('music-enabled') == 'false'
						? localStorage.getItem('music-enabled') == 'true'
						: true,
				animationDuration: 150,
			},
		);
		musicCheckbox.depth = 5;
		this.settingsMenuObjects.add(musicCheckbox);

		musicCheckbox.on('valuechange', function () {
			localStorage.setItem('music-enabled', musicCheckbox.checked);
		});

		let musicCheckboxText = this.add
			.text(this.screenWidth / 8, this.screenHeight / 2.9, 'Music', {
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 55,
				align: 'center',
			})
			.setOrigin(0.5, 0)
			.setInteractive()
			.on('pointerdown', () => musicCheckbox.toggleChecked());
		musicCheckboxText.setOrigin(0, 0.4).depth = 5;
		this.settingsMenuObjects.add(musicCheckboxText);

		let effectsCheckbox = this.add.rexCheckbox(
			this.screenWidth / 10,
			this.screenHeight / 2.3,
			this.screenWidth / 40,
			this.screenWidth / 40,
			{
				color: 0x323232,
				checked:
					localStorage.getItem('effects-enabled') == 'true' || localStorage.getItem('effects-enabled') == 'false'
						? localStorage.getItem('effects-enabled') == 'true'
						: true,
				animationDuration: 150,
			},
		);
		effectsCheckbox.depth = 5;
		this.settingsMenuObjects.add(effectsCheckbox);

		effectsCheckbox.on('valuechange', function () {
			localStorage.setItem('effects-enabled', effectsCheckbox.checked);
		});

		let effectsCheckboxText = this.add
			.text(this.screenWidth / 8, this.screenHeight / 2.3, 'Effects', {
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 55,
				align: 'center',
			})
			.setOrigin(0.5, 0)
			.setInteractive()
			.on('pointerdown', () => effectsCheckbox.toggleChecked());
		effectsCheckboxText.setOrigin(0, 0.4).depth = 5;
		this.settingsMenuObjects.add(effectsCheckboxText);

		let sliderDot = this.add.circle(
			this.screenWidth / 5.15,
			this.screenHeight / 1.6,
			this.screenWidth / 115,
			0xffffff,
			0.75,
		);
		sliderDot.slider = this.plugins.get('rexsliderplugin').add(sliderDot, {
			endPoints: [
				{
					x: sliderDot.x - this.screenWidth / 9.5,
					y: sliderDot.y,
				},
				{
					x: sliderDot.x + this.screenWidth / 9.5,
					y: sliderDot.y,
				},
			],
			value: 0.69,
		});
		sliderDot.depth = 5;
		this.settingsMenuObjects.add(sliderDot);

		let sliderBar = this.add.graphics();
		sliderBar.lineStyle(5, 0x373737, 1).strokePoints(sliderDot.slider.endPoints).depth = 4;
		this.settingsMenuObjects.add(sliderBar);

		let sliderDotText = this.add
			.text(this.screenWidth / 5.15, this.screenHeight / 1.85, 'General volume', {
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 60,
				align: 'center',
			})
			.setOrigin(0.5, 0);
		sliderDotText.depth = 5;
		this.settingsMenuObjects.add(sliderDotText);

		let sliderPercentageText = this.add
			.text(this.screenWidth / 5.15, this.screenHeight / 1.5, Math.trunc(sliderDot.slider.value * 100), {
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 80,
				align: 'center',
			})
			.setOrigin(0.5, 0);
		sliderPercentageText.depth = 5;
		this.settingsMenuObjects.add(sliderPercentageText);

		sliderDot.slider.on('valuechange', function () {
			sliderPercentageText.setText(Math.trunc(sliderDot.slider.value * 100));
			localStorage.setItem('volume', Math.trunc(sliderDot.slider.value * 100));
		});

		if (localStorage.getItem('volume')) {
			sliderDot.slider.value = localStorage.getItem('volume') / 100;
		}

		let separationLine = this.add.graphics();
		separationLine.lineStyle(0.5, 0xffffff, 0.1).strokePoints([
			{
				x: this.screenWidth / 2,
				y: this.screenHeight * 0.85,
			},
			{
				x: this.screenWidth / 2,
				y: this.screenHeight * 0.15,
			},
		]).depth = 4;
		this.settingsMenuObjects.add(separationLine);

		//> Controls

		let controlsText = this.add.text(this.screenWidth / 1.5, this.screenHeight - this.screenHeight * 0.85, 'Controls', {
			fontFamily: 'pixel_nums',
			fontSize: this.screenWidth / 45,
			align: 'center',
		});
		controlsText.depth = 5;
		this.settingsMenuObjects.add(controlsText);

		// Special thanks to chatGPT for making this list for me
		const specialCharMap = {
			8: 'BACKSPACE',
			9: 'TAB',
			13: 'ENTER',
			16: 'SHIFT',
			17: 'CTRL',
			18: 'ALT',
			20: 'CAPS',
			27: 'ESCAPE',
			32: 'SPACE',
			33: 'PAGE UP',
			34: 'PAGE DOWN',
			35: 'END',
			36: 'HOME',
			37: '←',
			38: '↑',
			39: '→',
			40: '↓',
			45: 'INSERT',
			46: 'DELETE',
			112: 'F1',
			113: 'F2',
			114: 'F3',
			115: 'F4',
			116: 'F5',
			117: 'F6',
			118: 'F7',
			119: 'F8',
			120: 'F9',
			121: 'F10',
			122: 'F11',
			123: 'F12',
			192: 'Ñ',
			219: '?',
			220: '¿',
		};

		const displayChar = (charCode) => specialCharMap[charCode] || String.fromCharCode(charCode);

		const directionTexts = [
			{
				control: 'JUMP',
				text: this.add.text(
					this.screenWidth / 1.37,
					this.screenHeight / 2.25,
					displayChar(this.controlKeys.JUMP.keyCode),
					{
						fontFamily: 'pixel_nums',
						fontSize: this.screenWidth / 55,
						align: 'center',
					},
				),
				icon: this.add
					.sprite(this.screenWidth / 1.37, this.screenHeight / 2, 'mario')
					.setScale(this.screenHeight / 500)
					.setOrigin(0.5)
					.anims.play('jump'),
			},
			{
				control: 'DOWN',
				text: this.add.text(
					this.screenWidth / 1.37,
					this.screenHeight / 1.75,
					displayChar(this.controlKeys.DOWN.keyCode),
					{
						fontFamily: 'pixel_nums',
						fontSize: this.screenWidth / 55,
						align: 'center',
					},
				),
				icon: this.add
					.sprite(this.screenWidth / 1.37, this.screenHeight / 1.68, 'mario-grown')
					.setScale(this.screenHeight / 550)
					.setOrigin(0.6, 0)
					.anims.play('grown-mario-crouch'),
			},
			{
				control: 'LEFT',
				text: this.add.text(
					this.screenWidth / 1.5,
					this.screenHeight / 1.75,
					displayChar(this.controlKeys.LEFT.keyCode),
					{
						fontFamily: 'pixel_nums',
						fontSize: this.screenWidth / 55,
						align: 'center',
					},
				),
				icon: this.add
					.sprite(this.screenWidth / 1.56, this.screenHeight / 1.75, 'mario')
					.setScale(this.screenHeight / 500)
					.setFlipX(true)
					.setOrigin(0.6, 0.5),
			},
			{
				control: 'RIGHT',
				text: this.add.text(
					this.screenWidth / 1.26,
					this.screenHeight / 1.75,
					displayChar(this.controlKeys.RIGHT.keyCode),
					{
						fontFamily: 'pixel_nums',
						fontSize: this.screenWidth / 55,
						align: 'center',
					},
				),
				icon: this.add
					.sprite(this.screenWidth / 1.22, this.screenHeight / 1.75, 'mario')
					.setScale(this.screenHeight / 500)
					.setOrigin(0.6, 0.5),
			},
			{
				control: 'FIRE',
				text: this.add.text(
					this.screenWidth / 1.65,
					this.screenHeight / 2.5,
					displayChar(this.controlKeys.FIRE.keyCode),
					{
						fontFamily: 'pixel_nums',
						fontSize: this.screenWidth / 55,
						align: 'center',
					},
				),
				icon: this.add
					.sprite(this.screenWidth / 1.65, this.screenHeight / 2.25, 'fireball')
					.setScale(this.screenHeight / 300)
					.setOrigin(0.5)
					.anims.play('fireball-right-down', true),
			},
		];

		directionTexts.forEach(({ control, text, icon }) => {
			text.setInteractive().setOrigin(0.5, 0.4).depth = 5;
			icon.depth = 5;
			this.settingsMenuObjects.add(text);
			this.settingsMenuObjects.add(icon);

			text.on(
				'pointerdown',
				function () {
					text.setText('...');

					keydownHandler = function (event) {
						document.removeEventListener('keydown', keydownHandler);

						let key = event.keyCode;

						if (Object.values(this.controlKeys).some(({ keyCode }) => keyCode === key)) {
							alert('Key is already in use!');
							text.setText(displayChar(this.controlKeys[control].keyCode));
							return;
						}

						this.controlKeys[control] = this.input.keyboard.addKey(key);
						text.setText(displayChar(this.controlKeys[control].keyCode));
						localStorage.setItem(control, this.controlKeys[control].keyCode);
					}.bind(this);
					document.addEventListener('keydown', keydownHandler);
				}.bind(this),
			);
		});
	}

	applySettings() {
		if (localStorage.getItem('volume')) {
			this.sound.volume = localStorage.getItem('volume') / 100;
		} else {
			this.sound.volume = 0.69;
		}

		if (localStorage.getItem('music-enabled')) {
			let isMuted = localStorage.getItem('music-enabled') == 'false';

			for (let music of Object.keys(this.musicGroup)) {
				this.musicGroup[music].setMute(isMuted);
			}
		}

		if (localStorage.getItem('effects-enabled')) {
			let isMuted = localStorage.getItem('effects-enabled') == 'false';

			for (let music of Object.keys(this.soundsEffectGroup)) {
				this.soundsEffectGroup[music].setMute(isMuted);
			}
		}
	}
}
