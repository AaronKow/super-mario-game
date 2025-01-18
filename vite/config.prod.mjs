import path from 'path';
import { defineConfig } from 'vite';

const phasermsg = () => {
	return {
		name: 'phasermsg',
		buildStart() {
			process.stdout.write(`Building for production...\n`);
		},
		buildEnd() {
			const line = '---------------------------------------------------------';
			const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
			process.stdout.write(`${line}\n${msg}\n${line}\n`);

			process.stdout.write(`✨ Done ✨\n`);
		},
	};
};

export default defineConfig({
	base: './',
	logLevel: 'info',
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '../'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ['phaser'],
				},
			},
		},
		minify: 'terser',
		terserOptions: {
			compress: {
				passes: 2,
			},
			mangle: true,
			format: {
				comments: false,
			},
		},
	},
	server: {
		port: 8080,
	},
	plugins: [phasermsg()],
});
