/**
 * WordPress dependencies
 */
import { addAction, addFilter } from '@wordpress/hooks';
import {
	doGutenbergNativeSetup,
	initialHtmlGutenberg,
} from '@wordpress/react-native-editor';
import { use } from '@wordpress/data';

/**
 * Internal dependencies
 */
import correctTextFontWeight from './text-font-weight-correct';
import setupJetpackEditor from './jetpack-editor-setup';
import setupBlockExperiments from './block-experiments-setup';
import initialHtml from './initial-html';

addAction( 'native.pre-render', 'gutenberg-mobile', () => {
	require( './strings-overrides' );
	correctTextFontWeight();
} );

addAction( 'native.render', 'gutenberg-mobile', ( props ) => {
	setupJetpackEditor(
		props.jetpackState || { blogId: 1, isJetpackActive: true }
	);
	const capabilities = props.capabilities ?? {};
	setupBlockExperiments( capabilities );
} );

addFilter( 'native.block_editor_props', 'gutenberg-mobile', ( editorProps ) => {
	if ( __DEV__ ) {
		let { initialTitle, initialData } = editorProps;

		if ( initialTitle === undefined ) {
			initialTitle = 'Welcome to gutenberg for WP Apps!';
		}

		if ( initialData === undefined ) {
			initialData = initialHtml + initialHtmlGutenberg;
		}

		return {
			...editorProps,
			initialTitle,
			initialData,
		};
	}
	return editorProps;
} );

const REDUX_TRACKING = {
	'core/block-editor': {
		moveBlocksUp: 'test',
		moveBlocksDown: 'test',
		removeBlocks: 'test',
		removeBlock: 'test',
		moveBlockToPosition: 'test',
		insertBlock: 'test',
		insertBlocks: 'test',
		replaceBlock: 'test',
		replaceBlocks: 'test',
		replaceInnerBlocks: 'test',
	},
};

function tracksRecordEvent( params ) {
	console.log( '>>> tracksRecordEvent', params );
}

use( ( registry ) => ( {
	dispatch: ( namespace ) => {
		const namespaceName =
			typeof namespace === 'object' ? namespace.name : namespace;
		const actions = { ...registry.dispatch( namespaceName ) };
		const trackers = REDUX_TRACKING[ namespaceName ];

		if ( trackers ) {
			Object.keys( trackers ).forEach( ( actionName ) => {
				const originalAction = actions[ actionName ];
				const tracker = trackers[ actionName ];
				actions[ actionName ] = ( ...args ) => {
					console.log(
						'action "%s" called with %o arguments',
						actionName,
						[ ...args ]
					);
					// We use a try-catch here to make sure the `originalAction`
					// is always called. We don't want to break the original
					// behaviour when our tracking throws an error.
					try {
						if ( typeof tracker === 'string' ) {
							// Simple track - just based on the event name.
							tracksRecordEvent( tracker );
						} else if ( typeof tracker === 'function' ) {
							// Advanced tracking - call function.
							tracker( ...args );
						}
					} catch ( err ) {
						// eslint-disable-next-line no-console
						console.error( err );
					}
					return originalAction( ...args );
				};
			} );
		}
		return actions;
	},
} ) );

doGutenbergNativeSetup();
