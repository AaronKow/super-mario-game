/**
	- Typically the first scene to load in the game.
	- Used for minimal, essential setup.
	- Loads a small number of assets quickly, such as a background image and progress bar for the preloader3.
	- Often used to set up the game configuration or load internal game settings.
	- Can be used to initialize the global registry3.
 */

import { Scene } from 'phaser';
import { gameStates } from '@/src/config';

export class Boot extends Scene {
	constructor() {
		super('Boot');
	}

	init() {
		// Configure GameStates
		for (let state of Object.keys(gameStates)) {
			this.registry.set(state, gameStates[state]);
		}
	}

	preload() {
		//  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
		//  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.
		this.load.image('background', 'assets/bg.png');
	}

	create() {
		console.log('>> load Boot');
		this.scene.start('Preloader');
	}
}
