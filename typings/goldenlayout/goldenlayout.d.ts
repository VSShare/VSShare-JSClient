declare class GoldenLayout {
	constructor(config: any, element: JQuery);
	registerComponent(title: string, callback: Function);
	init(): void;
	root: any;
	updateSize(width: number, height: number): void;
}