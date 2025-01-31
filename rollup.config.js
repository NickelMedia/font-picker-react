import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

export default {
	input: './src/FontPicker.tsx',
	output: [
		{
			file: pkg.main,
			format: 'cjs'
		},
		{
			file: pkg.module,
			format: 'es'
		}
	],
	external: ['@imposium-hub/font-manager', 'react'],
	plugins: [typescript()]
};
