/// <reference path="../../typings/vsshare/typings/vsshare/vsshare.d.ts" />
/// <reference path="../../typings/ace/ace.d.ts" />

'use strict';

namespace StyleClass {
	export const Modified = "modified";
}

export default class Session {

	_id: string;
	_filename: string;
	_type: ContentType;
	_owner: string;
	_doc: AceAjax.Document;
	_editor: AceAjax.Editor;
	_noLine: boolean;
	_isModified: boolean[] = [];
	Range = ace.require('./range').Range;
	
	constructor(id: string, filename: string, type: ContentType, owner: string) {
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
	}

	replaceLines(lines: Line[], row: number, lineLength: number) {
		var range = new this.Range(row, 0, row + lineLength - 1, this._doc.getLine(row + lineLength - 1).length);
		var linesStr = [];
		this._isModified.splice(row, lineLength);
		var currentRow = row;
		for(var i=0; i<lines.length; i++){
			var count = this._doc.$split(lines[i].text).length;
			for(var j=0; j<count; j++){
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
		for(var i=0; i<lines.length; i++) {
			var count = this._doc.$split(lines[i].text).length;
			textlines.concat(this._doc.$split(lines[i].text));
			for(var j=0; j<count; j++){
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

	removeAllModifiedMarkers(){
		var txtlen = this._doc.getLength();
		this._isModified.splice(txtlen, this._isModified.length - txtlen);
		for(var i=0; i<this._isModified.length; i++) {
			this._isModified[i] = false;
		}
		this.updateModifiedLines();
	}
	
	updateModifiedLines(){
		
		for(var i=0; i<this._isModified.length; i++) {
			if(this._isModified[i]) {
				if(!this._editor.session.$decorations[i] || !this._editor.session.$decorations[i].match("^"+StyleClass.Modified+"| "+StyleClass.Modified+" |"+StyleClass.Modified+"$")){
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
			switch(d.type){
				case UpdateType.Append:
					pos = this._doc.getLength();
				case UpdateType.Insert:
					if(this._noLine) {
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
	}

	updateSessionInfo(item: UpdateSessionInfoRequest) {
		this._filename = item.filename;
		this._type = item.type;
		this.setEditorMode(item.type);
	}
	
	setEditorMode(type: ContentType){
		var mode: string;
		switch(type){
			case ContentType.CSharp:
				mode = "ace/mode/csharp";
				break;
			case ContentType.JSON:
				mode = "ace/mode/json";
				break;
			case ContentType.VB_NET:
				mode = "ace/mode/vbscript";
				break;
			case ContentType.XML:
				mode = "ace/mode/xml";
				break;
			case ContentType.PlainText:
			default:
				mode = "ace/mode/plain_text";
				break;
		}
		this._editor.session.setMode(mode);
	}
	
	close() {
		
	}

	hasNoLine(): boolean {
		return this._noLine;
	}
}

