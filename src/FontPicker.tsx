import {
	Category,
	Font,
	FONT_FAMILY_DEFAULT,
	FontManager,
	Options,
	OPTIONS_DEFAULTS,
	Script,
	SortOption,
	Variant
} from '@imposium-hub/font-manager';
import * as React from 'react';

interface Props {
	// Required props
	apiKey: string;

	// Optional props
	activeFontFamily: string;
	onChange: (font: string) => void;
	pickerId: string;
	families: string[];
	categories: Category[];
	scripts: Script[];
	variants: Variant[];
	filter: (font: Font) => boolean;
	limit: number;
	sort: SortOption;
	defaultFonts: any;
	customFonts?: any;
}

interface State {
	expanded: boolean;
}

export default class FontPicker extends React.PureComponent<Props, State> {
	// Instance of the FontManager class used for managing, downloading and applying fonts
	fontManager: FontManager;

	static defaultProps = {
		activeFontFamily: FONT_FAMILY_DEFAULT,
		pickerId: OPTIONS_DEFAULTS.pickerId,
		families: OPTIONS_DEFAULTS.families,
		categories: OPTIONS_DEFAULTS.categories,
		scripts: OPTIONS_DEFAULTS.scripts,
		variants: OPTIONS_DEFAULTS.variants,
		filter: OPTIONS_DEFAULTS.filter,
		limit: OPTIONS_DEFAULTS.limit,
		sort: OPTIONS_DEFAULTS.sort
	};

	constructor(props: any) {
		super(props);

		const {
			apiKey,
			activeFontFamily,
			pickerId,
			families,
			categories,
			scripts,
			variants,
			filter,
			limit,
			sort,
			onChange
		} = this.props;

		this.state = {
			expanded: false
		};
		const options: Options = {
			pickerId,
			families,
			categories,
			scripts,
			variants,
			filter,
			limit,
			sort
		};

		// Initialize FontManager object
		this.fontManager = new FontManager(apiKey, activeFontFamily, options, onChange);
	}

	componentDidMount = () => {
		const { customFonts } = this.props;
		this.createFontStyleSheets(customFonts);
		// Generate font list
		this.fontManager
			.init()
			.then()
			.catch((err: Error): void => {
				console.error('Error trying to fetch the list of available fonts');
				console.error(err);
			});
	};

	/**
	 * After every component update, check whether the activeFontFamily prop has changed. If so,
	 * call this.setActiveFontFamily with the new font
	 */
	componentDidUpdate = (prevProps: any) => {
		const { activeFontFamily, onChange, customFonts } = this.props;
		if (prevProps.customFonts !== customFonts) {
			this.createFontStyleSheets(customFonts);
		}
		// If active font prop has changed: Update font family in font manager and component state
		if (activeFontFamily !== prevProps.activeFontFamily) {
			this.setActiveFontFamily(activeFontFamily);
		}

		// If onChange prop has changed: Update onChange function in font manager
		if (onChange !== prevProps.onChange) {
			this.fontManager.setOnChange(onChange);
		}
	};

	createFontStyleSheets = (availableFonts?: any): void => {
		const { defaultFonts } = this.props;
		defaultFonts.map((font: any) => {
			const fontId = font.name.toLowerCase().split(' ').join('-');
			this.fillFontStyleSheets(fontId, font);
		});

		if (availableFonts) {
			availableFonts.map((font: any) => {
				const fontId = font.name.toLowerCase();
				this.fillFontStyleSheets(fontId, font);
			});
		}
	};

	fillFontStyleSheets = (fontId: string, font: any) => {
		let stylesheetNode = document.getElementById(`font-${fontId}`);
		const { weight, file, url, name, family } = font;
		if (stylesheetNode === null) {
			stylesheetNode = stylesheetNode;
			stylesheetNode = document.createElement('style') as HTMLElement;
			if (stylesheetNode !== null) {
				stylesheetNode.id = `font-${fontId}`;
				stylesheetNode.setAttribute('data-is-preview', 'true');

				const fontWeight = weight ? `font-weight: ${weight};` : '';
				const fontUrl = file ? `fonts/${file}` : `${url}`;

				stylesheetNode.textContent = `
				@font-face {
					font-family: ${name !== family ? name : family};
					${fontWeight}
					src: url(${fontUrl});
				}`;

				document.head.appendChild(stylesheetNode);
			}
		}
	};

	/**
	 * EventListener for closing the font picker when clicking anywhere outside it
	 */
	onClose = (e: MouseEvent) => {
		let targetEl = e.target as Node; // Clicked element
		const fontPickerEl = document.getElementById(
			`font-picker${this.fontManager.selectorSuffix}`
		);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (targetEl === fontPickerEl) {
				// Click inside font picker: Exit
				return;
			}
			if (targetEl.parentNode) {
				// Click outside font picker: Move up the DOM
				targetEl = targetEl.parentNode;
			} else {
				// DOM root is reached: Toggle picker, exit
				this.toggleExpanded();
				return;
			}
		}
	};

	/**
	 * Update the active font on font button click
	 */
	onSelection = (e: React.MouseEvent | React.KeyboardEvent): void => {
		const target = e.target as HTMLButtonElement;
		const activeFontFamily = target.textContent;
		if (!activeFontFamily) {
			throw Error(`Missing font family in clicked font button`);
		}
		this.setActiveFontFamily(activeFontFamily);
		this.toggleExpanded();
	};

	/**
	 * Set the specified font as the active font in the fontManager and update activeFontFamily in the
	 * state
	 */
	setActiveFontFamily = (activeFontFamily: string): void => {
		this.fontManager.setActiveFont(activeFontFamily);
	};

	/**
	 * Generate <ul> with all font families
	 */
	generateFontList = () => {
		const { activeFontFamily, families } = this.props;

		return (
			<ul className='font-list'>
				{families.map((font): React.ReactElement => {
					const isActive = font === activeFontFamily;
					// const fontId = getFontId(font.family);
					return (
						<li
							key={font}
							className='font-list-item'>
							<button
								type='button'
								id={`font-button-${font}${this.fontManager.selectorSuffix}`}
								className={`font-button ${isActive ? 'active-font' : ''}`}
								onClick={this.onSelection}
								onKeyPress={this.onSelection}
								style={{ fontFamily: font }}>
								{font}
							</button>
						</li>
					);
				})}
			</ul>
		);
	};

	/**
	 * Expand/collapse the picker's font list
	 */
	toggleExpanded = (): void => {
		const { expanded } = this.state;

		if (expanded) {
			this.setState({
				expanded: false
			});
			document.removeEventListener('click', () => this.onClose);
		} else {
			this.setState({
				expanded: true
			});
			document.addEventListener('click', () => this.onClose);
		}
	};

	render = () => {
		const { activeFontFamily } = this.props;
		const { expanded } = this.state;

		// Render font picker button and attach font list to it
		return (
			<div
				id={`font-picker${this.fontManager.selectorSuffix}`}
				className={expanded ? 'expanded' : ''}>
				<button
					type='button'
					className='dropdown-button'
					onClick={this.toggleExpanded}
					onKeyPress={this.toggleExpanded}>
					<p className='dropdown-font-family'>{activeFontFamily}</p>
					<p className='dropdown-icon finished' />
				</button>
				{this.generateFontList()}
			</div>
		);
	};
}
