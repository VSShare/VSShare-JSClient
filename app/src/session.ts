/// <reference path="../../typings/vsshare/typings/vsshare/vsshare.d.ts" />
/// <reference path="../../typings/ace/ace.d.ts" />

'use strict';

namespace StyleClass {
	export const Modified = "modified";
	export const GutterActiveLine = "ace_gutter-real-active-line";
	export const Cursor = "ace_real-cursor";
	export const ActiveLine = "ace_real-active-line";
	export const Selection = "ace_real-selection";
}

export default class Session {

	_id: string;
	_filename: string;
	_type: string;
	_owner: string;
	_doc: AceAjax.Document;
	_editor: AceAjax.Editor;
	_noLine: boolean;
	_isModified: boolean[] = [];
	Range = ace.require('./range').Range;
	_cursorPos: CursorPosition;
	_selectionStartPos: CursorPosition;


	constructor(id: string, filename: string, type: string, owner: string) {
		this._id = id;
		this._filename = filename;
		this._type = type;
		this._owner = owner;
		this._noLine = true;
	}

	setEditor(element: HTMLElement) {
		this._editor = ace.edit(<HTMLElement>element.querySelector("#code-" + this._id));
		// オンオフで切り替える
		//this._editor["_emit"] = (name:string, e: MouseEvent) => {};
		//this._editor["$callKeyboardHandlers"] = (hashId:number, keyString: string, keyCode: number, e: KeyboardEvent) => {};
		this.setEditorMode(this._type);
		this._editor.setReadOnly(true);
		this._editor.setOption("maxLines", (element.clientHeight) / this._editor.renderer.layerConfig.lineHeight);
		this._doc = this._editor.session.doc;
		var cursorMarker = {}, lineMarker = {};
		let self = this;
		cursorMarker["update"] = (html, marker, session, config) => { self.updateCursorMarker(html, marker, session, config, self) };
		lineMarker["update"] = (html, marker, session, config) => { self.updateLineMarker(html, marker, session, config, self) };
		this._editor.session.addDynamicMarker(cursorMarker, true);
		this._editor.session.addDynamicMarker(lineMarker, false);

	}

	replaceLines(lines: Line[], row: number, lineLength: number) {
		var range = new this.Range(row, 0, row + lineLength - 1, this._doc.getLine(row + lineLength - 1).length);
		var linesStr = [];
		this._isModified.splice(row, lineLength);
		var currentRow = row;
		for (var i = 0; i < lines.length; i++) {
			var count = this._doc.$split(lines[i].text).length;
			for (var j = 0; j < count; j++) {
				this._isModified.splice(currentRow + j, 0, lines[i].modified);
			}
			currentRow += count;
			linesStr.push(lines[i].text);
		}
		this.updateModifiedLines();
        this._doc.replace(range, linesStr.join("\n"));
    }

    insertLines(lines: Line[], row: number) {
		var textlines = [];
		var currentRow = row;
		for (var i = 0; i < lines.length; i++) {
			var count = this._doc.$split(lines[i].text).length;
			textlines.concat(this._doc.$split(lines[i].text));
			for (var j = 0; j < count; j++) {
				this._isModified.splice(currentRow + j, 0, lines[i].modified);
			}
			currentRow += count;
		}
		this.updateModifiedLines();
        this._doc.insertFullLines(row, textlines);
    }

    removeLines(startRow: number, lineLength: number) {
		this._isModified.splice(startRow, lineLength);
		this.updateModifiedLines();
        this._doc.removeFullLines(startRow, startRow + lineLength - 1);
    }

	removeAllModifiedMarkers() {
		var txtlen = this._doc.getLength();
		this._isModified.splice(txtlen, this._isModified.length - txtlen);
		for (var i = 0; i < this._isModified.length; i++) {
			this._isModified[i] = false;
		}
		this.updateModifiedLines();
	}

	updateModifiedLines() {

		for (var i = 0; i < this._isModified.length; i++) {
			if (this._isModified[i]) {
				if (!this._editor.session.$decorations[i] || !this._editor.session.$decorations[i].match("^" + StyleClass.Modified + "| " + StyleClass.Modified + " |" + StyleClass.Modified + "$")) {
					this._editor.session.addGutterDecoration(i, StyleClass.Modified);
				}
			} else {
				this._editor.session.removeGutterDecoration(i, StyleClass.Modified);
			}
		}
	}

	dispose() {
		// 終了処理
		
	}

	updateContent(item: UpdateSessionContentRequest) {
		item.data.sort((a: UpdateContentData, b: UpdateContentData) => {
			return a.order - b.order;
		})
		item.data.forEach(d => {
			var pos = d.pos;
			switch (d.type) {
				case UpdateType.Append:
					pos = this._doc.getLength();
				case UpdateType.Insert:
					if (this._noLine) {
						this.replaceLines(d.data, 0, 1);
						this._noLine = false;
					} else {
						this.insertLines(d.data, pos);
					}
					break;
				case UpdateType.Delete:
					this.removeLines(d.pos, d.len);
					this._noLine = false;
					break;
				case UpdateType.Replace:
					this.replaceLines(d.data, d.pos, d.len);
					this._noLine = false;
					break;
				case UpdateType.ResetAll:
					this.removeLines(0, this._doc.getLength());
					this._noLine = true;
				case UpdateType.RemoveMarker:
					this.removeAllModifiedMarkers();
					break;

			}
		});
	}

	updateCursor(item: UpdateSessionCursorRequest) {
		if (!this._cursorPos) {
			this._editor.session.addGutterDecoration(item.active.line, StyleClass.GutterActiveLine);
		} else if (this._cursorPos.line != item.active.line) {
			this._editor.session.removeGutterDecoration(this._cursorPos.line, StyleClass.GutterActiveLine);
			this._editor.session.addGutterDecoration(item.active.line, StyleClass.GutterActiveLine);
		}
		this._cursorPos = item.active;
		switch (item.type) {
			case CursorType.Point:
				this._selectionStartPos = undefined;
				break;
			case CursorType.Select:
				this._selectionStartPos = item.anchor;
				break;
		}
		this._editor.renderer.updateFrontMarkers();
		this._editor.renderer.updateBackMarkers();
	}

	updateCursorMarker(html: any[], marker: any, session: AceAjax.IEditSession, config: any, self: Session) {
		if (!self._cursorPos) {
			return;
		}
		var span = document.createElement("span");
		span.style.visibility = "hidden";
		document.body.appendChild(span);
		span.className = "ace_editor";
		span.innerHTML = this._editor.session.getLine(self._cursorPos.line).substring(0, self._cursorPos.pos).replace(/ /g, "A").replace(/\t/g, "AAAA");;
		var left = config.padding + Math.round(span.offsetWidth / config.characterWidth) * config.characterWidth;
		
		var top = config.lineHeight * self._cursorPos.line;
		var width = config.characterWidth;
		var height = config.lineHeight;
		html.push(`<div class="${StyleClass.Cursor}" style="left: ${left}px; top: ${top}px; widht: ${width}px; height: ${height}px"></div>`);
	}

	updateLineMarker(html: any[], marker: any, session: AceAjax.IEditSession, config: any, self: Session) {
		if (!self._cursorPos) {
			return;
		}
		if (self._selectionStartPos) {
			var pos1, pos2;
			if (self._cursorPos.line == self._selectionStartPos.line) {
				if (self._cursorPos.pos < self._selectionStartPos.pos) {
					pos1 = self._cursorPos;
					pos2 = self._selectionStartPos;
				} else {
					pos1 = self._selectionStartPos;
					pos2 = self._cursorPos;
				}
				
			} else if (self._cursorPos.line < self._selectionStartPos.line) {
				pos1 = self._cursorPos;
				pos2 = self._selectionStartPos;
			} else {
				pos1 = self._selectionStartPos;
				pos2 = self._cursorPos;
			}
			
			var span = document.createElement("span");
			span.style.visibility = "hidden";
			document.body.appendChild(span);
			span.className = "ace_editor";
			span.innerHTML = this._editor.session.getLine(pos1.line).substring(0, pos1.pos).replace(/ /g, "A").replace(/\t/g, "AAAA");;
			console.log(span.offsetWidth);
			var left = Math.round(span.offsetWidth / config.characterWidth) * config.characterWidth;
			
			span.innerHTML = this._editor.session.getLine(pos2.line).substring(0, pos2.pos).replace(/ /g, "A").replace(/\t/g, "AAAA");;
			var right = Math.round(span.offsetWidth / config.characterWidth) * config.characterWidth;
			
			document.body.removeChild(span);
			
			var top1 = config.lineHeight * pos1.line;
			var top2 = config.lineHeight * pos2.line;
			if (pos1.line == pos2.line) {
				html.push(
					`<div class="${StyleClass.Selection}" style="left: ${config.padding+left}px; width: ${right-left}px; top: ${top1}px; height: ${config.lineHeight}px"></div>`);
			} else {
				html.push(
					`<div class="${StyleClass.Selection}" style="left: ${config.padding+left}px; right: ${config.padding}px; top: ${top1}px; height: ${config.lineHeight}px"></div>
					<div class="${StyleClass.Selection}" style="left: ${config.padding}px; right: ${config.padding}px; top: ${top1 + config.lineHeight}px; height: ${config.lineHeight * (pos2.line - pos1.line - 1) }px"></div>
					<div class="${StyleClass.Selection}" style="left: ${config.padding}px; width: ${right}px; top: ${top2}px; height: ${config.lineHeight}px"></div>`);
			}
		} else {
			var top = config.lineHeight * self._cursorPos.line;
			var height = config.lineHeight;
			html.push(`<div class="${StyleClass.ActiveLine}" style="left: 0; right: 0; top: ${top}px; height: ${height}px"></div>`);
		}
	}

	updateSessionInfo(item: UpdateSessionInfoRequest) {
		this._filename = item.filename;
		this._type = item.type;
		this.setEditorMode(item.type);
	}

	setEditorMode(type: string) {
		var mode: string;
		switch (type) {
			case "code:csharp":
				mode = "ace/mode/csharp";
				break;
			case "code:json":
				mode = "ace/mode/json";
				break;
			default:
				mode = "ace/mode/plain_text";
				break;
		}
		console.log(type);
		this._editor.session.setMode(mode);
	}

	close() {

	}

	hasNoLine(): boolean {
		return this._noLine;
	}
}

